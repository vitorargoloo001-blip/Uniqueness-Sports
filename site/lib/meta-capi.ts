import "server-only";
import crypto from "crypto";

// API de Conversões (server-side) — espelha os eventos do Pixel direto do
// backend, pelo webhook do Mercado Pago. Sobrevive a ad blocker, Safari/ITP
// e cliente que fecha a aba antes do Pixel disparar; é o motivo de termos
// os dois. Mesmo PIXEL_ID do Pixel (lib/meta-pixel.ts) — as duas pontas
// escrevem no mesmo conjunto de dados no Gerenciador de Eventos.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || "";
// Só em teste: preenche com o código da aba "Testar eventos" do Gerenciador
// de Eventos pra ver o evento chegar na hora. Deixar vazio em produção.
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Telefone BR em qualquer formato -> E.164 só dígitos (ex: 5511999999999), como a Meta exige antes do hash. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) return digits;
  return `55${digits}`;
}

export type CapiEventInput = {
  eventName: "Purchase" | "InitiateCheckout" | "Lead" | string;
  /** Mesmo ID usado no evento espelho do Pixel (lib/meta-pixel.ts trackEvent) — habilita a dedup da Meta. */
  eventId: string;
  eventSourceUrl: string;
  email?: string | null;
  phone?: string | null;
  /** ID interno (ex: Order.id) — hasheado e mandado como external_id, mais um sinal de correspondência. */
  externalId?: string | null;
  value?: number;
  currency?: string;
  contents?: { id: string; quantity: number; item_price: number }[];
  clientIp?: string | null;
  userAgent?: string | null;
  /** Cookies _fbp/_fbc do navegador, quando disponíveis — melhoram muito a qualidade de correspondência. */
  fbp?: string | null;
  fbc?: string | null;
};

/**
 * Manda um evento pra API de Conversões da Meta. Nunca lança — falha de
 * rede ou configuração ausente só loga e segue (não pode derrubar o
 * webhook do Mercado Pago nem o checkout por causa de tracking).
 */
export async function sendCapiEvent(input: CapiEventInput): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn(
      `[meta-capi] NEXT_PUBLIC_META_PIXEL_ID ou META_CONVERSIONS_API_ACCESS_TOKEN não configurados — evento "${input.eventName}" não enviado.`,
    );
    return;
  }

  const userData: Record<string, unknown> = {};
  if (input.email) userData.em = [sha256(input.email)];
  if (input.phone) userData.ph = [sha256(normalizePhone(input.phone))];
  if (input.externalId) userData.external_id = [sha256(input.externalId)];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const customData: Record<string, unknown> = {};
  if (input.value !== undefined) customData.value = input.value;
  if (input.currency) customData.currency = input.currency;
  if (input.contents) {
    customData.contents = input.contents;
    customData.content_type = "product";
  }

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[meta-capi] erro ao enviar "${input.eventName}":`, res.status, errText);
    }
  } catch (err) {
    console.error(`[meta-capi] falha de rede ao enviar "${input.eventName}":`, err);
  }
}
