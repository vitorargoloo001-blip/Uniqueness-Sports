"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { addOrderEvent, restoreOrderStockOnce } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/status";
import type { OrderStatus } from "@/lib/generated/prisma/client";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResult> {
  await requireAdmin();

  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!current) return { success: false, error: "Pedido não encontrado" };

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  await addOrderEvent(orderId, status, ORDER_STATUS_LABELS[status] ?? status);
  await restoreOrderStockOnce(current.status, status, orderId);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
  return { success: true, data: undefined };
}

export async function setTrackingAction(
  orderId: string,
  carrier: string,
  trackingCode: string,
  trackingUrl: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!trackingCode.trim()) return { success: false, error: "Informe o código de rastreio" };

  await prisma.order.update({
    where: { id: orderId },
    data: { carrier: carrier || null, trackingCode, trackingUrl: trackingUrl || null },
  });
  await addOrderEvent(orderId, "SHIPPED", `Código de rastreio adicionado: ${trackingCode}`);

  revalidatePath(`/pedidos/${orderId}`);
  return { success: true, data: undefined };
}
