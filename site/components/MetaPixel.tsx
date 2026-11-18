"use client";

import { useEffect } from "react";
import Script from "next/script";
import { META_PIXEL_ID, trackEvent } from "@/lib/meta-pixel";

/**
 * Clique em qualquer link de WhatsApp do site (rodapé, /contato, produto)
 * vira um evento Contact. Um listener só, no documento, pra não precisar
 * transformar cada link (a maioria em Server Components) em Client Component.
 */
function useWhatsappContactTracking() {
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (link && /wa\.me|api\.whatsapp\.com/.test(link.getAttribute("href") ?? "")) {
        trackEvent("Contact", { content_name: "WhatsApp" });
      }
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}

/**
 * Base do Meta Pixel — carrega fbevents.js, inicializa e dispara o PageView
 * automático em toda navegação (o próprio fbevents.js escuta pushState).
 * Some sozinho (sem erro) se NEXT_PUBLIC_META_PIXEL_ID ainda não estiver
 * configurada.
 */
export default function MetaPixel() {
  useWhatsappContactTracking();
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- pixel de fallback sem JS, precisa ser <img> */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
