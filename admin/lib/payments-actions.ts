"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { addOrderEvent, restoreOrderStockOnce } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/status";
import { cancelPayment, getPayment, refundPayment } from "@/lib/mercado-pago";
import type { NormalizedStatus } from "@/lib/mercado-pago";
import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Só mexemos em pagamento que existe do lado do Mercado Pago. */
async function requirePayment(paymentId: string) {
  await requireAdmin();
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      orderId: true,
      status: true,
      provider: true,
      providerPaymentId: true,
      amount: true,
      paidAt: true,
      order: { select: { status: true, orderNumber: true } },
    },
  });
  if (!payment) throw new Error("Pagamento não encontrado");
  if (payment.provider !== "MERCADO_PAGO") {
    throw new Error("Esse pagamento não é do Mercado Pago.");
  }
  if (!payment.providerPaymentId) {
    throw new Error("Esse pagamento nunca chegou a ser criado no Mercado Pago.");
  }
  return { ...payment, providerPaymentId: payment.providerPaymentId };
}

/**
 * Estorna no Mercado Pago e reflete no pedido. `amount` em branco devolve
 * tudo; com valor, faz estorno parcial.
 *
 * Estorno total leva o pedido pra REFUNDED e devolve o estoque. Estorno
 * parcial não mexe no status — o pedido continua válido, só saiu dinheiro de
 * volta —, fica registrado no histórico.
 */
export async function refundPaymentAction(
  paymentId: string,
  amount?: number,
): Promise<ActionResult<{ amount: number; isTotal: boolean }>> {
  try {
    const payment = await requirePayment(paymentId);
    if (payment.status !== "PAID") {
      return { success: false, error: "Só dá pra estornar pagamento aprovado." };
    }
    if (amount !== undefined && !(amount > 0)) {
      return { success: false, error: "Informe um valor maior que zero." };
    }

    const result = await refundPayment(payment.providerPaymentId, amount);
    if (!result.success) return result;
    const { amount: refunded, isTotal } = result.data;

    // `increment` e não o valor cru: vários estornos parciais se somam, e é
    // esse acumulado que o webhook do Mercado Pago vai confirmar depois.
    await prisma.payment.update({
      where: { id: paymentId },
      data: { refundedAmount: { increment: refunded } },
    });

    if (isTotal) {
      await prisma.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
      await addOrderEvent(payment.orderId, "REFUNDED", `Estorno total de ${money(refunded)}.`);
      await restoreOrderStockOnce(payment.order.status, "REFUNDED", payment.orderId);
    } else {
      await addOrderEvent(payment.orderId, payment.order.status, `Estorno parcial de ${money(refunded)}.`);
    }

    revalidatePath(`/pedidos/${payment.orderId}`);
    revalidatePath("/pedidos");
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao estornar" };
  }
}

/**
 * Cancela um pagamento que ainda não foi pago (Pix/boleto esperando) e, se o
 * pedido ainda estiver aguardando pagamento, cancela o pedido junto e
 * devolve o estoque — que é o ponto: pedido abandonado para de segurar peça.
 */
export async function cancelPaymentAction(paymentId: string): Promise<ActionResult> {
  try {
    const payment = await requirePayment(paymentId);
    if (payment.status !== "PENDING") {
      return { success: false, error: "Só dá pra cancelar pagamento que ainda não foi pago." };
    }

    const result = await cancelPayment(payment.providerPaymentId);
    if (!result.success) return result;

    await prisma.payment.update({ where: { id: paymentId }, data: { status: "CANCELED" } });

    if (payment.order.status === "PENDING_PAYMENT") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELED", paymentStatus: "CANCELED" },
      });
      await addOrderEvent(payment.orderId, "CANCELED", ORDER_STATUS_LABELS.CANCELED);
      await restoreOrderStockOnce(payment.order.status, "CANCELED", payment.orderId);
    }

    revalidatePath(`/pedidos/${payment.orderId}`);
    revalidatePath("/pedidos");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao cancelar pagamento" };
  }
}

/** Pra qual status do pedido cada status de pagamento leva, e a partir de quais. */
const ORDER_TRANSITIONS: Record<string, { to: OrderStatus; from: string[] }> = {
  PAID: { to: "PAID", from: ["PENDING_PAYMENT", "CANCELED"] },
  CANCELED: { to: "CANCELED", from: ["PENDING_PAYMENT"] },
  REFUNDED: { to: "REFUNDED", from: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
};

/**
 * Relê o pagamento no Mercado Pago e grava o que vier. Serve pra quando um
 * webhook se perde e o pedido fica travado num status que já mudou lá.
 *
 * Mesmas transições do `applyPaymentEvent` do site — nenhum status pode
 * regredir o pedido. Não inclui a inserção no Melhor Envio (isso é o
 * "Sincronizar agora" do card de envio), então um pedido que vire PAID aqui
 * entra no Melhor Envio pelo cron ou por aquele botão.
 */
export async function syncPaymentAction(paymentId: string): Promise<ActionResult<NormalizedStatus>> {
  try {
    const payment = await requirePayment(paymentId);

    const result = await getPayment(payment.providerPaymentId);
    if (!result.success) return result;
    const remote = result.data;

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: remote.status as PaymentStatus,
        paymentMethod: remote.paymentMethod,
        amount: remote.amount || payment.amount,
        // Valor absoluto: o Mercado Pago é a verdade sobre o acumulado.
        refundedAmount: remote.refunded,
        // `?? new Date()` e não `new Date()` direto: sincronizar de novo um
        // pagamento já pago não pode reescrever a data em que ele foi pago.
        paidAt: remote.status === "PAID" ? (payment.paidAt ?? new Date()) : undefined,
        rawPayload: remote.raw as never,
      },
    });

    const transition = ORDER_TRANSITIONS[remote.status];
    if (transition?.from.includes(payment.order.status)) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: transition.to, paymentStatus: remote.status as PaymentStatus },
      });
      await addOrderEvent(
        payment.orderId,
        transition.to,
        ORDER_STATUS_LABELS[transition.to] ?? transition.to,
      );
      await restoreOrderStockOnce(payment.order.status, transition.to, payment.orderId);
    }

    revalidatePath(`/pedidos/${payment.orderId}`);
    revalidatePath("/pedidos");
    return { success: true, data: remote.status };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao consultar pagamento" };
  }
}
