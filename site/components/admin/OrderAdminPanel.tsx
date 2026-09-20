"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, setTrackingAction } from "@/lib/admin";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as (keyof typeof ORDER_STATUS_LABELS)[];

export default function OrderAdminPanel({
  orderId,
  currentStatus,
  carrier,
  trackingCode,
  trackingUrl,
}: {
  orderId: string;
  currentStatus: string;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [carrierInput, setCarrierInput] = useState(carrier ?? "");
  const [codeInput, setCodeInput] = useState(trackingCode ?? "");
  const [urlInput, setUrlInput] = useState(trackingUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function saveStatus() {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status as never);
      setMessage(result.success ? "Status atualizado." : result.error);
      router.refresh();
    });
  }

  function saveTracking() {
    if (!codeInput) {
      setMessage("Informe o código de rastreio.");
      return;
    }
    startTransition(async () => {
      const result = await setTrackingAction(orderId, carrierInput, codeInput, urlInput);
      setMessage(result.success ? "Rastreio salvo." : result.error);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
          Status do pedido
        </h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-3 w-full border border-border bg-surface px-4 py-3 text-sm text-ink"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={saveStatus}
          className="mt-3 bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85 disabled:opacity-60"
        >
          Atualizar status
        </button>
      </div>

      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
          Rastreamento
        </h3>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Transportadora"
            value={carrierInput}
            onChange={(e) => setCarrierInput(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-3 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Código de rastreio"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-3 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Link de rastreio (opcional)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-3 text-sm text-ink"
          />
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={saveTracking}
          className="mt-3 bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85 disabled:opacity-60"
        >
          Salvar rastreio
        </button>
      </div>

      {message && <p className="text-sm text-ink/70 sm:col-span-2">{message}</p>}
    </div>
  );
}
