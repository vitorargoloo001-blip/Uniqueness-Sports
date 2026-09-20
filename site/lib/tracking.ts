"use server";

import { trackOrderSchema, type TrackOrderInput } from "@/lib/validations";
import { getOrderByNumberAndEmail } from "@/lib/orders";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof getOrderByNumberAndEmail>>>) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  };
}

export type TrackedOrder = ReturnType<typeof serializeOrder>;

export async function trackOrderAction(
  input: TrackOrderInput,
): Promise<ActionResult<TrackedOrder>> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const order = await getOrderByNumberAndEmail(parsed.data.orderNumber, parsed.data.email);
  if (!order) {
    return { success: false, error: "Pedido não encontrado. Confira o número e o email." };
  }

  return { success: true, data: serializeOrder(order) };
}
