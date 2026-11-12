import "server-only";

/**
 * Operações de etiqueta do Melhor Envio usadas só pelo admin — comprar com
 * saldo, gerar, imprimir e cancelar. O `site/` fala com a mesma API mas faz
 * outra coisa (cotar frete e inserir o pedido no carrinho), então aqui não
 * há duplicação de lógica, só das credenciais.
 *
 * Fluxo de uma etiqueta: pedido entra no carrinho (o site faz isso quando o
 * pagamento aprova) → checkout (paga com saldo) → generate (gera a etiqueta)
 * → print (devolve o PDF pra imprimir) → postar nos Correios.
 */

const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const BASE_URL =
  process.env.MELHOR_ENVIO_ENV === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
const CONTACT_EMAIL = process.env.MELHOR_ENVIO_FROM_EMAIL ?? "";

export const isMelhorEnvioConfigured = Boolean(TOKEN);

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string };

async function meRequest<T>(path: string, body?: unknown, method: "GET" | "POST" = "POST"): Promise<T> {
  if (!TOKEN) throw new Error("MELHOR_ENVIO_TOKEN não configurado no painel");
  const res = await fetch(`${BASE_URL}/api/v2${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      "User-Agent": `Uniqueness Admin (${CONTACT_EMAIL})`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(describeError(res.status, data));
  return data as T;
}

function describeError(status: number, data: unknown): string {
  if (status === 401) return "token do Melhor Envio inválido ou expirado";
  if (!data || typeof data !== "object") return `Melhor Envio respondeu ${status}`;
  const { errors, message, error } = data as {
    errors?: Record<string, string[] | string>;
    message?: string;
    error?: string;
  };
  if (errors) return Object.values(errors).flat().join(" ");
  return message ?? error ?? `Melhor Envio respondeu ${status}`;
}

/** Saldo da carteira — o que dá pra gastar comprando etiqueta. */
export async function getBalance(): Promise<Result<{ balance: number; reserved: number }>> {
  if (!isMelhorEnvioConfigured) return { success: false, error: "Melhor Envio não configurado" };
  try {
    const d = await meRequest<{ balance: number; reserved: number }>("/me/balance", undefined, "GET");
    return { success: true, data: { balance: d.balance ?? 0, reserved: d.reserved ?? 0 } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao consultar saldo" };
  }
}

type ShipmentRow = { id?: string; price?: number; paid_at?: string | null; canceled_at?: string | null };

/**
 * Quanto já saiu de etiqueta, por envio. A chave é o mesmo id que guardamos
 * em `Order.melhorEnvioId`, então dá pra cruzar com o frete cobrado do
 * cliente e ver a margem real.
 *
 * Só conta etiqueta **paga** (`paid_at` preenchido, sem cancelamento):
 * envio parado no carrinho ainda não custou nada.
 */
export async function getPaidLabelCosts(): Promise<Result<Record<string, number>>> {
  if (!isMelhorEnvioConfigured) return { success: false, error: "Melhor Envio não configurado" };

  try {
    const costs: Record<string, number> = {};
    // Paginado; um pedido por página de 100 dá conta de muita venda antes de
    // valer a pena guardar o custo no banco na hora da compra da etiqueta.
    for (let page = 1; page <= MAX_SHIPMENT_PAGES; page++) {
      const body = await meRequest<{ data?: ShipmentRow[]; last_page?: number }>(
        `/me/orders?per_page=100&page=${page}`,
        undefined,
        "GET",
      );
      for (const row of body.data ?? []) {
        if (!row.id || !row.paid_at || row.canceled_at) continue;
        costs[row.id] = Number(row.price ?? 0);
      }
      if (page >= (body.last_page ?? 1)) break;
    }
    return { success: true, data: costs };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao consultar etiquetas" };
  }
}

const MAX_SHIPMENT_PAGES = 10;

/**
 * Paga a etiqueta com o saldo e já gera. Os dois passos andam juntos porque
 * etiqueta paga e não gerada não serve pra nada.
 */
export async function buyLabel(shipmentId: string): Promise<Result<undefined>> {
  try {
    await meRequest("/me/shipment/checkout", { orders: [shipmentId] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao comprar etiqueta";
    // A API responde 422 quando já foi paga — nesse caso seguimos pra geração.
    if (!/já foram pagas|already been paid/i.test(msg)) {
      return { success: false, error: msg };
    }
  }

  try {
    await meRequest("/me/shipment/generate", { orders: [shipmentId] });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao gerar etiqueta" };
  }
}

/**
 * Link do PDF pra imprimir. Só funciona depois de paga e gerada. Com vários
 * envios o Melhor Envio devolve um PDF só com todas as etiquetas.
 */
export async function getLabelUrl(shipmentIds: string[]): Promise<Result<string>> {
  try {
    const d = await meRequest<{ url?: string }>("/me/shipment/print", {
      orders: shipmentIds,
      mode: "public",
    });
    if (!d.url) return { success: false, error: "Melhor Envio não devolveu o link da etiqueta" };
    return { success: true, data: d.url };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao imprimir etiqueta" };
  }
}

export type ShipmentTracking = { status: string; tracking: string | null };

/**
 * Status e código de rastreio atuais de cada envio, direto da API. O código
 * da transportadora (`tracking`) pode demorar; até lá vale o do próprio
 * Melhor Envio, que o melhorrastreio também entende.
 */
export async function getTracking(shipmentIds: string[]): Promise<Result<Record<string, ShipmentTracking>>> {
  try {
    const infos: Record<string, ShipmentTracking> = {};
    for (let i = 0; i < shipmentIds.length; i += 50) {
      const data = await meRequest<
        Record<string, { status: string; tracking: string | null; melhorenvio_tracking: string | null }>
      >("/me/shipment/tracking", { orders: shipmentIds.slice(i, i + 50) });
      for (const [id, t] of Object.entries(data)) {
        infos[id] = { status: t.status, tracking: t.tracking ?? t.melhorenvio_tracking ?? null };
      }
    }
    return { success: true, data: infos };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao consultar rastreio" };
  }
}

/** Mesmo link que o site grava em Order.trackingUrl (site/lib/melhor-envio.ts). */
export function trackingUrlFor(code: string) {
  return `https://www.melhorrastreio.com.br/rastreio/${code}`;
}

/** Cancela o envio no Melhor Envio (reason_id 2 é o código de integração). */
export async function cancelShipment(shipmentId: string, motivo: string): Promise<Result<undefined>> {
  try {
    await meRequest("/me/shipment/cancel", {
      order: { id: shipmentId, reason_id: "2", description: motivo },
    });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao cancelar envio" };
  }
}
