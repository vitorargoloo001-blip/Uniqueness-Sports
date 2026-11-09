"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type MetaStandardEvent, type MetaEventData } from "@/lib/meta-pixel";

/**
 * Dispara um evento do Pixel quando o componente monta (ViewContent,
 * InitiateCheckout, Purchase) — usado em páginas server component, que não
 * podem chamar window.fbq diretamente. `eventId` (quando informado) é
 * compartilhado com o evento espelho da API de Conversões pra dedup.
 */
export default function MetaPixelEvent({
  event,
  data,
  eventId,
}: {
  event: MetaStandardEvent;
  data?: MetaEventData;
  eventId?: string;
}) {
  // Evita disparar 2x no StrictMode do dev (useEffect roda 2x só em dev).
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, data, eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só na montagem, com os valores do 1º render
  }, []);

  return null;
}
