// Meta Pixel (client-side) — ID público, não é segredo. Fica vazio até o
// pixel ser criado no Gerenciador de Eventos (ver README/CLAUDE.md desta
// pasta); com a env var vazia, MetaPixel não renderiza o script e
// trackEvent vira um no-op silencioso.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type FbqContents = { id: string; quantity: number; item_price?: number }[];

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type MetaEventData = {
  content_ids?: string[];
  content_name?: string;
  content_type?: "product";
  contents?: FbqContents;
  value?: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
};

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
  }
}

/**
 * Dispara um evento padrão do Pixel no navegador. `eventId` é o mesmo ID
 * usado no evento espelho enviado pela API de Conversões (lib/meta-capi.ts)
 * pra esse evento — a Meta deduplica os dois automaticamente quando os IDs
 * batem (event_name + event_id), evitando contar a mesma compra 2x.
 */
export function trackEvent(event: MetaStandardEvent, data?: MetaEventData, eventId?: string): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", event, data ?? {}, { eventID: eventId });
  } else {
    window.fbq("track", event, data ?? {});
  }
}
