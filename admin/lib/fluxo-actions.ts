"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { buyLabel, getLabelUrl, getTracking, trackingUrlFor } from "@/lib/melhor-envio";
import {
  LABEL_READY,
  PREPARATION_BLOCKED,
  moveToDelivered,
  moveToProcessing,
  moveToShipped,
  shipmentState,
  type BatchOutcome,
} from "@/lib/fluxo";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function refresh() {
  // Contadores da sidebar e as três abas mudam juntos.
  revalidatePath("/", "layout");
}

/**
 * Novos → Em preparo. Compra e gera a etiqueta no Melhor Envio (com o saldo
 * da conta) quando ainda não foi comprada; pedido de envio manual passa direto.
 */
export async function startPreparationAction(orderIds: string[]): Promise<ActionResult<BatchOutcome>> {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, status: "PAID" },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true, shippingServiceId: true, melhorEnvioId: true, shippingStatus: true },
  });

  const outcome: BatchOutcome = { done: 0, errors: [] };
  for (const order of orders) {
    const state = shipmentState(order);
    const blocked = PREPARATION_BLOCKED[state];
    if (blocked) {
      outcome.errors.push({ orderNumber: order.orderNumber, error: blocked });
      continue;
    }

    if (state === "comprar") {
      const bought = await buyLabel(order.melhorEnvioId!);
      if (!bought.success) {
        outcome.errors.push({ orderNumber: order.orderNumber, error: bought.error });
        continue;
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { shippingStatus: "generated", shippingError: null },
      });
    }

    if (await moveToProcessing(order.id)) outcome.done++;
  }

  refresh();
  return { success: true, data: outcome };
}

/** Um PDF só com as etiquetas dos pedidos selecionados em preparo. */
export async function printLabelsAction(orderIds: string[]): Promise<ActionResult<string>> {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
      status: "PROCESSING",
      melhorEnvioId: { not: null },
      shippingStatus: { in: [...LABEL_READY] },
    },
    select: { melhorEnvioId: true },
  });
  if (orders.length === 0) {
    return { success: false, error: "Nenhum dos pedidos selecionados tem etiqueta gerada." };
  }

  return getLabelUrl(orders.map((order) => order.melhorEnvioId!));
}

/**
 * Em preparo → Postados. Confere no Melhor Envio que a etiqueta existe e
 * pega o código de rastreio, que vai pro cliente no site na mesma hora.
 * Envio manual precisa do rastreio já informado na página do pedido.
 */
export async function markShippedAction(orderIds: string[]): Promise<ActionResult<BatchOutcome>> {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, status: "PROCESSING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true, melhorEnvioId: true, trackingCode: true, trackingUrl: true },
  });

  const shipmentIds = orders.flatMap((order) => (order.melhorEnvioId ? [order.melhorEnvioId] : []));
  const tracking = shipmentIds.length > 0 ? await getTracking(shipmentIds) : { success: true as const, data: {} };
  if (!tracking.success) return tracking;

  const outcome: BatchOutcome = { done: 0, errors: [] };
  for (const order of orders) {
    let moved: boolean;

    if (order.melhorEnvioId) {
      const info = tracking.data[order.melhorEnvioId];
      if (!info || !LABEL_READY.has(info.status)) {
        outcome.errors.push({
          orderNumber: order.orderNumber,
          error: "a etiqueta ainda não foi gerada no Melhor Envio",
        });
        continue;
      }
      const code = info.tracking ?? order.trackingCode;
      moved = await moveToShipped(order.id, {
        trackingCode: code,
        trackingUrl: code ? trackingUrlFor(code) : order.trackingUrl,
        shippingStatus: info.status,
      });
    } else {
      if (!order.trackingCode) {
        outcome.errors.push({
          orderNumber: order.orderNumber,
          error: "envio manual: informe o código de rastreio na página do pedido antes",
        });
        continue;
      }
      moved = await moveToShipped(order.id, { trackingCode: order.trackingCode, trackingUrl: order.trackingUrl });
    }

    if (moved) outcome.done++;
  }

  refresh();
  return { success: true, data: outcome };
}

/**
 * Postados → Entregue, na mão. O Melhor Envio já faz isso sozinho (webhook e
 * sincronização); aqui é pra envio manual ou quando o cliente confirmou antes.
 */
export async function markDeliveredAction(orderIds: string[]): Promise<ActionResult<BatchOutcome>> {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, status: "SHIPPED" },
    select: { id: true },
  });

  const outcome: BatchOutcome = { done: 0, errors: [] };
  for (const order of orders) {
    if (await moveToDelivered(order.id)) outcome.done++;
  }

  refresh();
  return { success: true, data: outcome };
}
