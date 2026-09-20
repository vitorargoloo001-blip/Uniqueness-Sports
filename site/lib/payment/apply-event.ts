import "server-only";
import { prisma } from "@/lib/prisma";
import { restoreOrderStock, addOrderEvent } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { sendOrderToMelhorEnvio } from "@/lib/melhor-envio";
import type { WebhookEvent } from "@/lib/payment/types";

// Pra qual status cada pagamento leva o pedido, e a partir de quais status.
// Eventos chegam repetidos e fora de ordem — pelo webhook do Mercado Pago
// (ex: Pix expira depois que o cliente já pagou no cartão; payment.updated
// de um pagamento aprovado quando o pedido já foi enviado) e também porque
// o Payment Brick aplica esse mesmo evento na hora, antes do webhook chegar
// — nenhum caminho pode regredir o pedido. FAILED fica de fora: o cliente
// tenta outro cartão/meio de pagamento no mesmo pedido depois de uma
// recusa, então recusa não cancela nada.
const ORDER_TRANSITIONS: Record<string, { to: string; from: string[] }> = {
  PAID: { to: "PAID", from: ["PENDING_PAYMENT", "CANCELED"] },
  CANCELED: { to: "CANCELED", from: ["PENDING_PAYMENT"] },
  REFUNDED: { to: "REFUNDED", from: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
};

/**
 * Aplica um evento de pagamento ao pedido — chamada tanto pelo webhook do
 * Mercado Pago quanto, na hora, pela resposta síncrona do Payment Brick
 * (lib/checkout.ts's payOrderAction), pra não esperar o webhook pra
 * atualizar o pedido. Upsert do Payment é idempotente
 * (providerPaymentId é @unique), então os dois caminhos podem processar o
 * mesmo pagamento sem duplicar nada.
 */
export async function applyPaymentEvent(event: WebhookEvent & { orderId: string }): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: event.orderId } });
  if (!order) {
    console.error("[payment] pedido não encontrado:", event.orderId);
    return;
  }

  await prisma.payment.upsert({
    where: { providerPaymentId: event.providerPaymentId },
    update: {
      status: event.status,
      paymentMethod: event.paymentMethod,
      amount: event.amount ?? order.total,
      paidAt: event.status === "PAID" ? new Date() : undefined,
      rawPayload: event.raw as never,
    },
    create: {
      orderId: order.id,
      provider: "MERCADO_PAGO",
      providerPaymentId: event.providerPaymentId,
      status: event.status,
      paymentMethod: event.paymentMethod,
      amount: event.amount ?? order.total,
      paidAt: event.status === "PAID" ? new Date() : null,
      rawPayload: event.raw as never,
    },
  });

  const transition = ORDER_TRANSITIONS[event.status];
  const newOrderStatus = transition?.from.includes(order.status) ? transition.to : undefined;
  if (newOrderStatus) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: newOrderStatus as never, paymentStatus: event.status as never },
    });
    await addOrderEvent(
      order.id,
      newOrderStatus,
      ORDER_STATUS_LABELS[newOrderStatus] ?? newOrderStatus,
    );

    if (newOrderStatus === "CANCELED" || newOrderStatus === "REFUNDED") {
      await restoreOrderStock(order.id);
    }

    // Pago → envio entra no carrinho do Melhor Envio (não lança; falha fica
    // em Order.shippingError e o cron diário tenta de novo).
    if (newOrderStatus === "PAID") {
      await sendOrderToMelhorEnvio(order.id);
    }
  } else if (
    (event.status === "PENDING" || event.status === "FAILED") &&
    order.status === "PENDING_PAYMENT" &&
    order.paymentStatus !== event.status
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: event.status },
    });
  }
}
