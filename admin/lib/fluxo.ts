import "server-only";
import { prisma } from "@/lib/prisma";
import { addOrderEvent } from "@/lib/orders";
import {
  FLOW_STAGES,
  ORDER_STATUS_LABELS,
  SHIPPING_STATUS_LABELS,
  type FlowStatus,
  type StatusVariant,
} from "@/lib/status";

/**
 * Fluxo de envio: Pedidos novos (PAID) → Em preparo (PROCESSING) → Postados
 * (SHIPPED). As páginas em app/(dashboard)/pedidos/{novos,em-preparo,postados}
 * leem daqui; as ações ficam em lib/fluxo-actions.ts.
 *
 * Tudo que sai daqui pra Client Component é objeto montado campo a campo,
 * com Decimal já convertido (ver CLAUDE.md, "server/client module boundary").
 */

/** Resultado das ações em lote (lib/fluxo-actions.ts): quantos avançaram e, pra cada um que não, o motivo. */
export type BatchOutcome = { done: number; errors: { orderNumber: string; error: string }[] };

/** Status do Melhor Envio em que a etiqueta já está gerada e dá pra imprimir. */
export const LABEL_READY = new Set(["generated", "received", "posted", "delivered"]);

/** Quantos pedidos em cada etapa — abas das páginas e contadores da sidebar. */
export async function getFlowCounts(): Promise<Record<FlowStatus, number>> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    where: { status: { in: FLOW_STAGES.map((stage) => stage.status) } },
    _count: { _all: true },
  });
  const counts: Record<FlowStatus, number> = { PAID: 0, PROCESSING: 0, SHIPPED: 0 };
  for (const row of rows) counts[row.status as FlowStatus] = row._count._all;
  return counts;
}

type Item = { name: string; quantity: number };

function cidade(order: { shippingCity: string; shippingState: string }) {
  return `${order.shippingCity} - ${order.shippingState}`;
}

// ---------------------------------------------------------------------------
// Pedidos novos
// ---------------------------------------------------------------------------

/** Onde o envio de um pedido pago está, do ponto de vista de quem vai preparar. */
export type ShipmentState = "comprar" | "pronta" | "manual" | "entrando" | "erro" | "cancelada";

export function shipmentState(order: {
  shippingServiceId: number | null;
  melhorEnvioId: string | null;
  shippingStatus: string | null;
}): ShipmentState {
  // Sem frete do Melhor Envio no checkout (pedido antigo, por exemplo).
  if (!order.shippingServiceId && !order.melhorEnvioId) return "manual";
  if (order.shippingStatus === "error") return "erro";
  if (!order.melhorEnvioId) return "entrando";
  if (order.shippingStatus && LABEL_READY.has(order.shippingStatus)) return "pronta";
  if (order.shippingStatus === "canceled" || order.shippingStatus === "expired") return "cancelada";
  // pending (no carrinho) ou released (paga, falta gerar): buyLabel resolve os dois.
  return "comprar";
}

const SHIPMENT_STATE: Record<ShipmentState, { label: string; variant: StatusVariant }> = {
  comprar: { label: "Pronto pra comprar etiqueta", variant: "info" },
  pronta: { label: "Etiqueta já comprada", variant: "success" },
  manual: { label: "Envio manual", variant: "neutral" },
  entrando: { label: "Entrando no Melhor Envio…", variant: "warning" },
  erro: { label: "Falhou ao entrar no Melhor Envio", variant: "danger" },
  cancelada: { label: "Etiqueta cancelada", variant: "neutral" },
};

/** Por que um pedido não pode ir pro preparo ainda. Estados fora daqui podem. */
export const PREPARATION_BLOCKED: Partial<Record<ShipmentState, string>> = {
  entrando: "o envio ainda não entrou no Melhor Envio. Sincronize e tente de novo",
  erro: "o envio falhou ao entrar no Melhor Envio. Veja o erro na página do pedido",
  cancelada: "a etiqueta foi cancelada. Resolva na página do pedido",
};

export type NewOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  items: Item[];
  total: number;
  shippingTotal: number;
  service: string | null;
  deliveryDays: number | null;
  paidAt: string;
  shipment: {
    state: ShipmentState;
    label: string;
    variant: StatusVariant;
    detail: string | null;
    canPrepare: boolean;
  };
};

/** Pagos e ainda não preparados, do mais antigo pro mais novo (fila). */
export async function getNewOrders(): Promise<NewOrder[]> {
  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      shippingCity: true,
      shippingState: true,
      total: true,
      shippingTotal: true,
      carrier: true,
      shippingDeliveryDays: true,
      shippingServiceId: true,
      melhorEnvioId: true,
      shippingStatus: true,
      shippingError: true,
      createdAt: true,
      items: { select: { name: true, quantity: true }, orderBy: { name: "asc" } },
      payments: {
        where: { status: "PAID" },
        select: { paidAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => {
    const state = shipmentState(order);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      city: cidade(order),
      items: order.items,
      total: Number(order.total),
      shippingTotal: Number(order.shippingTotal),
      service: order.carrier,
      deliveryDays: order.shippingDeliveryDays,
      paidAt: (order.payments[0]?.paidAt ?? order.createdAt).toISOString(),
      shipment: {
        state,
        ...SHIPMENT_STATE[state],
        detail: state === "erro" ? order.shippingError : null,
        canPrepare: !PREPARATION_BLOCKED[state],
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Em preparo
// ---------------------------------------------------------------------------

/** "pronta" = dá pra imprimir e postar; "sem-etiqueta" = Melhor Envio sem etiqueta gerada. */
export type LabelState = "pronta" | "sem-etiqueta" | "manual";

export type PreparingOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  items: Item[];
  service: string | null;
  label: LabelState;
  trackingCode: string | null;
  since: string;
};

export async function getPreparingOrders(): Promise<PreparingOrder[]> {
  const orders = await prisma.order.findMany({
    where: { status: "PROCESSING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      shippingCity: true,
      shippingState: true,
      carrier: true,
      melhorEnvioId: true,
      shippingStatus: true,
      trackingCode: true,
      updatedAt: true,
      items: { select: { name: true, quantity: true }, orderBy: { name: "asc" } },
      events: {
        where: { status: "PROCESSING" },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    city: cidade(order),
    items: order.items,
    service: order.carrier,
    label: !order.melhorEnvioId
      ? "manual"
      : order.shippingStatus && LABEL_READY.has(order.shippingStatus)
        ? "pronta"
        : "sem-etiqueta",
    trackingCode: order.trackingCode,
    since: (order.events[0]?.createdAt ?? order.updatedAt).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Postados
// ---------------------------------------------------------------------------

/** Status do Melhor Envio que pedem ação (o pacote travou no caminho). */
const SHIPMENT_PROBLEM = new Set(["undelivered", "paused", "suspended", "canceled", "expired"]);

/** Dias úteis (seg a sex, sem feriados) desde `start`. Aproximado de propósito: serve pra sinalizar atraso. */
function businessDaysSince(start: Date, now = new Date()): number {
  let days = 0;
  const day = new Date(start);
  for (;;) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (day > now) return days;
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days++;
  }
}

export type ShippedOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  city: string;
  service: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  shipmentStatus: { label: string; variant: StatusVariant } | null;
  postedAt: string;
  businessDays: number;
  deliveryDays: number | null;
  late: boolean;
};

export async function getShippedOrders(): Promise<ShippedOrder[]> {
  const orders = await prisma.order.findMany({
    where: { status: "SHIPPED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      shippingCity: true,
      shippingState: true,
      carrier: true,
      trackingCode: true,
      trackingUrl: true,
      shippingStatus: true,
      shippingDeliveryDays: true,
      updatedAt: true,
      events: {
        where: { status: "SHIPPED" },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => {
    const postedAt = order.events[0]?.createdAt ?? order.updatedAt;
    const businessDays = businessDaysSince(postedAt);
    const status = order.shippingStatus;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      city: cidade(order),
      service: order.carrier,
      trackingCode: order.trackingCode,
      trackingUrl: order.trackingUrl,
      shipmentStatus: status
        ? {
            label: SHIPPING_STATUS_LABELS[status] ?? status,
            variant: SHIPMENT_PROBLEM.has(status) ? "danger" : status === "delivered" ? "success" : "info",
          }
        : null,
      postedAt: postedAt.toISOString(),
      businessDays,
      deliveryDays: order.shippingDeliveryDays,
      late: order.shippingDeliveryDays !== null && businessDays > order.shippingDeliveryDays,
    };
  });
}

// ---------------------------------------------------------------------------
// Transições — condicionais no status de origem: se outro caminho (webhook
// do Melhor Envio no site, outra aba) já moveu o pedido, não move de novo
// nem duplica o evento que o cliente vê no site.
// ---------------------------------------------------------------------------

export async function moveToProcessing(orderId: string): Promise<boolean> {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: "PAID" },
    data: { status: "PROCESSING" },
  });
  if (moved.count === 0) return false;
  await addOrderEvent(orderId, "PROCESSING", ORDER_STATUS_LABELS.PROCESSING);
  return true;
}

export async function moveToShipped(
  orderId: string,
  shipment: { trackingCode: string | null; trackingUrl: string | null; shippingStatus?: string },
): Promise<boolean> {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: "PROCESSING" },
    data: { status: "SHIPPED", ...shipment },
  });
  if (moved.count === 0) return false;
  // Mesmo texto que o site grava quando o Melhor Envio avisa da postagem.
  const tracking = shipment.trackingCode ? ` Código de rastreio: ${shipment.trackingCode}` : "";
  await addOrderEvent(orderId, "SHIPPED", `Pedido enviado.${tracking}`);
  return true;
}

export async function moveToDelivered(orderId: string): Promise<boolean> {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: "SHIPPED" },
    data: { status: "DELIVERED" },
  });
  if (moved.count === 0) return false;
  await addOrderEvent(orderId, "DELIVERED", ORDER_STATUS_LABELS.DELIVERED);
  return true;
}
