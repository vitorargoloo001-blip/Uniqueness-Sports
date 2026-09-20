"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addOrderEvent, ORDER_STATUS_LABELS, restoreOrderStock } from "@/lib/orders";
import type { OrderStatus } from "@/lib/generated/prisma/client";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acesso restrito a administradores");
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  await addOrderEvent(orderId, status, ORDER_STATUS_LABELS[status] ?? status);

  if (status === "CANCELED" || status === "REFUNDED") {
    await restoreOrderStock(orderId);
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  return { success: true, data: undefined };
}

export async function setTrackingAction(
  orderId: string,
  carrier: string,
  trackingCode: string,
  trackingUrl: string,
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.order.update({
    where: { id: orderId },
    data: { carrier, trackingCode, trackingUrl: trackingUrl || null },
  });
  await addOrderEvent(orderId, "SHIPPED", `Código de rastreio adicionado: ${trackingCode}`);

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true, data: undefined };
}

export async function toggleProductActiveAction(productId: string): Promise<ActionResult> {
  await requireAdmin();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: "Produto não encontrado" };

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { success: true, data: undefined };
}

export async function updateStockAction(
  productId: string,
  stock: number,
): Promise<ActionResult> {
  await requireAdmin();
  if (stock < 0) return { success: false, error: "Estoque não pode ser negativo" };

  await prisma.product.update({ where: { id: productId }, data: { stock } });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { success: true, data: undefined };
}
