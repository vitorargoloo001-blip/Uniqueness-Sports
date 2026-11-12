import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { applyFreeShipping, shipmentVolumes, type ShippingOption } from "@/lib/shipping-rules";
import type { Order, OrderStatus } from "@/lib/generated/prisma/client";

const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const WEBHOOK_SECRET = process.env.MELHOR_ENVIO_WEBHOOK_SECRET;
const BASE_URL =
  process.env.MELHOR_ENVIO_ENV === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
// Correios PAC (1) e SEDEX (2) por padrão: não exigem escolher agência de
// postagem, então entram no carrinho sem intervenção manual.
const SERVICES = process.env.MELHOR_ENVIO_SERVICES || "1,2";
// Sem NF-e o envio vai como declaração de conteúdo. Quem emite nota põe
// "false" e informa a chave no painel do Melhor Envio antes de pagar a etiqueta.
const NON_COMMERCIAL = process.env.MELHOR_ENVIO_NON_COMMERCIAL !== "false";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const from = (field: string) => process.env[`MELHOR_ENVIO_FROM_${field}`]?.trim() ?? "";
const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

export const isMelhorEnvioConfigured = Boolean(TOKEN && digits(from("POSTAL_CODE")).length === 8);

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Uma linha do carrinho/pedido. `weightGrams` é o peso do produto por unidade, sem a caixa. */
export type ShippingItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  weightGrams: number | null;
  /** Quantas unidades cabem numa caixa. Null = padrão de shipping-rules. */
  unitsPerBox: number | null;
};

type MeQuote = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name: string };
};

async function meRequest<T>(path: string, body: unknown): Promise<T> {
  if (!TOKEN) throw new Error("MELHOR_ENVIO_TOKEN não configurado");
  const res = await fetch(`${BASE_URL}/api/v2${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      // Obrigatório pela API: nome da aplicação + email de contato.
      "User-Agent": `Uniqueness Sports (${from("EMAIL")})`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Melhor Envio ${res.status}: ${describeError(data)}`);
  return data as T;
}

function describeError(data: unknown): string {
  if (!data || typeof data !== "object") return "resposta inesperada";
  const { errors, message, error } = data as {
    errors?: Record<string, string[] | string>;
    message?: string;
    error?: string;
  };
  if (errors) return Object.values(errors).flat().join(" ");
  return message ?? error ?? "resposta inesperada";
}

function declaredValue(items: ShippingItem[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

async function quote(toPostalCode: string, items: ShippingItem[], services: string): Promise<MeQuote[]> {
  const result = await meRequest<MeQuote[] | MeQuote>("/me/shipment/calculate", {
    from: { postal_code: digits(from("POSTAL_CODE")) },
    to: { postal_code: digits(toPostalCode) },
    // Uma entrada por caixa — pedido grande sai em mais de uma.
    volumes: shipmentVolumes(items),
    options: { insurance_value: declaredValue(items), receipt: false, own_hand: false },
    services,
  });
  // Com um serviço só no filtro a API devolve o objeto solto, não uma lista.
  return Array.isArray(result) ? result : [result];
}

/**
 * Opções de frete pro CEP, já com a regra de frete grátis aplicada sobre
 * `orderValue` (subtotal com cupom). Usada no checkout e de novo, pelo
 * servidor, na criação do pedido — o preço que vale é sempre o recotado.
 */
export async function getShippingOptions(
  toPostalCode: string,
  items: ShippingItem[],
  orderValue: number,
): Promise<ActionResult<ShippingOption[]>> {
  if (!isMelhorEnvioConfigured) {
    return { success: false, error: "Cálculo de frete indisponível no momento. Fale com a gente pelo WhatsApp." };
  }

  try {
    const options = (await quote(toPostalCode, items, SERVICES))
      .filter((q) => !q.error && (q.custom_price ?? q.price))
      .map(
        (q): ShippingOption => ({
          serviceId: q.id,
          label: [q.company?.name, q.name].filter(Boolean).join(" "),
          price: Number(q.custom_price ?? q.price),
          quotedPrice: Number(q.custom_price ?? q.price),
          deliveryDays: q.custom_delivery_time ?? q.delivery_time ?? 0,
          free: false,
        }),
      );
    if (options.length === 0) {
      return { success: false, error: "Nenhuma opção de frete atende esse CEP." };
    }
    return { success: true, data: applyFreeShipping(options, orderValue) };
  } catch (err) {
    console.error("[melhor-envio] cotação falhou:", err);
    return { success: false, error: "Não foi possível calcular o frete agora. Tente de novo em instantes." };
  }
}

function sender() {
  const required = ["NAME", "PHONE", "EMAIL", "DOCUMENT", "ADDRESS", "NUMBER", "DISTRICT", "CITY", "STATE"];
  const missing = required.filter((field) => !from(field));
  if (missing.length > 0) {
    throw new Error(`dados do remetente faltando: ${missing.map((f) => `MELHOR_ENVIO_FROM_${f}`).join(", ")}`);
  }

  const document = digits(from("DOCUMENT"));
  return {
    name: from("NAME"),
    phone: digits(from("PHONE")),
    email: from("EMAIL"),
    // CNPJ vai em company_document (+ inscrição estadual); CPF em document.
    ...(document.length === 14
      ? { company_document: document, state_register: from("STATE_REGISTER") || undefined }
      : { document }),
    address: from("ADDRESS"),
    number: from("NUMBER"),
    complement: from("COMPLEMENT") || undefined,
    district: from("DISTRICT"),
    city: from("CITY"),
    state_abbr: from("STATE").toUpperCase(),
    country_id: "BR",
    postal_code: digits(from("POSTAL_CODE")),
  };
}

/**
 * Cria o envio do pedido no carrinho do Melhor Envio (o lojista paga e
 * imprime a etiqueta lá). Chamado quando o pagamento aprova e, de novo,
 * pelo cron diário pros que falharam. Nunca lança: falha fica em
 * Order.shippingError pro admin ver.
 */
export async function sendOrderToMelhorEnvio(orderId: string): Promise<void> {
  if (!isMelhorEnvioConfigured) return;

  // Trava: webhooks do Mercado Pago chegam repetidos — só um processo insere.
  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      melhorEnvioId: null,
      shippingServiceId: { not: null },
      OR: [{ shippingStatus: null }, { shippingStatus: "error" }],
    },
    data: { shippingStatus: "sending" },
  });
  if (claimed.count === 0) return;

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  try {
    const items: ShippingItem[] = order.items.map((item) => ({
      id: item.productId ?? item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      weightGrams: item.product?.weightGrams ?? null,
      unitsPerBox: item.product?.unitsPerBox ?? null,
    }));

    // Confirma que o serviço escolhido ainda atende esse CEP antes de inserir.
    const [chosen] = await quote(order.shippingZipCode, items, String(order.shippingServiceId));
    if (!chosen || chosen.error) {
      throw new Error(chosen?.error ?? "serviço de frete indisponível pra esse CEP");
    }

    const created = await meRequest<{ id: string; protocol?: string }>("/me/cart", {
      service: order.shippingServiceId,
      from: sender(),
      to: {
        name: order.customerName,
        phone: digits(order.customerPhone),
        email: order.customerEmail,
        document: digits(order.customerCpf),
        address: order.shippingStreet,
        number: order.shippingNumber,
        complement: order.shippingComplement ?? undefined,
        district: order.shippingDistrict,
        city: order.shippingCity,
        state_abbr: order.shippingState,
        country_id: "BR",
        postal_code: digits(order.shippingZipCode),
      },
      products: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitary_value: Number(item.unitPrice),
      })),
      // Mesmas caixas da cotação.
      volumes: shipmentVolumes(items),
      options: {
        insurance_value: Number(order.subtotal),
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: NON_COMMERCIAL,
        platform: "Uniqueness Sports",
        tags: [{ tag: order.orderNumber, url: SITE_URL }],
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { melhorEnvioId: created.id, shippingStatus: "pending", shippingError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[melhor-envio] falha ao criar envio do pedido", order.orderNumber, message);
    await prisma.order.update({
      where: { id: order.id },
      data: { shippingStatus: "error", shippingError: message },
    });
  }
}

export type ShipmentInfo = { status: string; tracking: string | null };

// Status do Melhor Envio → status do pedido, e a partir de quais status.
// Nunca regride (webhook e cron podem chegar fora de ordem).
const SHIPMENT_TRANSITIONS: Record<string, { to: OrderStatus; from: OrderStatus[] }> = {
  released: { to: "PROCESSING", from: ["PAID"] },
  generated: { to: "PROCESSING", from: ["PAID"] },
  received: { to: "SHIPPED", from: ["PAID", "PROCESSING"] },
  posted: { to: "SHIPPED", from: ["PAID", "PROCESSING"] },
  delivered: { to: "DELIVERED", from: ["PAID", "PROCESSING", "SHIPPED"] },
};

type SyncableOrder = Pick<Order, "id" | "status" | "shippingStatus" | "trackingCode">;

/** Aplica o status/rastreio reportado pelo Melhor Envio ao pedido (idempotente). */
export async function applyShipmentUpdate(order: SyncableOrder, info: ShipmentInfo): Promise<void> {
  const tracking = info.tracking || null;
  const trackingChanged = tracking !== null && tracking !== order.trackingCode;
  if (info.status === order.shippingStatus && !trackingChanged) return;

  const transition = SHIPMENT_TRANSITIONS[info.status];
  const newStatus = transition?.from.includes(order.status) ? transition.to : undefined;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      shippingStatus: info.status,
      ...(trackingChanged && {
        trackingCode: tracking,
        trackingUrl: `https://www.melhorrastreio.com.br/rastreio/${tracking}`,
      }),
      ...(newStatus && { status: newStatus }),
    },
  });

  if (newStatus) {
    const trackingNote = newStatus === "SHIPPED" && tracking ? ` Código de rastreio: ${tracking}` : "";
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: newStatus,
        message: `${ORDER_STATUS_LABELS[newStatus] ?? newStatus}.${trackingNote}`,
      },
    });
  }
}

/** Status atual de cada envio direto da API (fonte da verdade pro cron). */
async function fetchShipmentInfo(ids: string[]): Promise<Record<string, ShipmentInfo>> {
  const infos: Record<string, ShipmentInfo> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const data = await meRequest<
      Record<string, { status: string; tracking: string | null; melhorenvio_tracking: string | null }>
    >("/me/shipment/tracking", { orders: ids.slice(i, i + 50) });
    for (const [id, t] of Object.entries(data)) {
      infos[id] = { status: t.status, tracking: t.tracking ?? t.melhorenvio_tracking ?? null };
    }
  }
  return infos;
}

/**
 * Rede de segurança do cron diário: reenvia pedidos pagos que não
 * entraram no Melhor Envio e sincroniza status/rastreio dos envios em
 * andamento (caso algum webhook tenha se perdido).
 */
export async function runMelhorEnvioSync(): Promise<{ sent: number; synced: number }> {
  if (!isMelhorEnvioConfigured) return { sent: 0, synced: 0 };

  const pending = await prisma.order.findMany({
    where: {
      status: "PAID",
      melhorEnvioId: null,
      shippingServiceId: { not: null },
      OR: [{ shippingStatus: null }, { shippingStatus: "error" }],
    },
    select: { id: true },
  });
  for (const { id } of pending) await sendOrderToMelhorEnvio(id);

  const active = await prisma.order.findMany({
    where: { melhorEnvioId: { not: null }, status: { in: ["PAID", "PROCESSING", "SHIPPED"] } },
    select: { id: true, status: true, shippingStatus: true, trackingCode: true, melhorEnvioId: true },
  });
  const infos = await fetchShipmentInfo(active.map((o) => o.melhorEnvioId!));
  for (const order of active) {
    const info = infos[order.melhorEnvioId!];
    if (info) await applyShipmentUpdate(order, info);
  }

  return { sent: pending.length, synced: active.length };
}

/**
 * Webhook do Melhor Envio: X-ME-Signature = HMAC-SHA256 do corpo cru com o
 * secret do aplicativo (Área Dev). A doc mostra base64; aceita hex também.
 */
export function verifyMelhorEnvioSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const digest = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest();
  const received = Buffer.from(signature.trim());
  return [digest.toString("base64"), digest.toString("hex")].some((expected) => {
    const buf = Buffer.from(expected);
    return buf.length === received.length && timingSafeEqual(buf, received);
  });
}
