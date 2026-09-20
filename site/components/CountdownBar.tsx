"use client";

import { useEffect, useState } from "react";
import { formatOfferValue } from "@/lib/format";

type Props = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  expiresAt: string | null; // ISO — serializado do server component, nunca um objeto Date
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function CountdownBar({ code, type, value, expiresAt }: Props) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [remaining, setRemaining] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!target) return;

    function tick() {
      const diff = target! - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining(null);
        return;
      }
      setRemaining(formatRemaining(diff));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Se tinha prazo e já passou, a faixa some sozinha (sem esperar um novo
  // deploy) — evita anunciar um cupom que já não vale mais.
  if (expired) return null;

  return (
    <div className="bg-black py-2 text-center text-white">
      <p className="px-4 text-[11px] uppercase tracking-[0.08em] sm:text-xs">
        Cupom <strong className="font-heading">{code}</strong> — {formatOfferValue({ type, value })} em toda a loja
        {remaining && <span className="text-white/70"> · termina em {remaining}</span>}
      </p>
    </div>
  );
}
