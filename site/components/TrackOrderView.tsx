"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackOrderSchema, type TrackOrderInput } from "@/lib/validations";
import { trackOrderAction, type TrackedOrder } from "@/lib/tracking";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/lib/format";

export default function TrackOrderView() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackOrderInput>({ resolver: zodResolver(trackOrderSchema) });

  async function onSubmit(data: TrackOrderInput) {
    setServerError(null);
    setOrder(null);
    const result = await trackOrderAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setOrder(result.data);
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="text-xs uppercase tracking-[0.08em] text-gray">
            Número do pedido
          </label>
          <input
            type="text"
            {...register("orderNumber")}
            placeholder="US26082712345"
            className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
          {errors.orderNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.orderNumber.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.08em] text-gray">Email da compra</label>
          <input
            type="email"
            {...register("email")}
            className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-fit self-end bg-ink px-7 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {isSubmitting ? "Buscando..." : "Rastrear"}
        </button>
      </form>

      {serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

      {order && (
        <div className="mt-10 space-y-6">
          <div className="border border-border bg-surface p-6">
            <p className="text-xs text-gray">Pedido</p>
            <p className="font-heading text-lg text-ink">{order.orderNumber}</p>
            <p className="mt-2 text-xs text-gray">Status atual</p>
            <p className="font-heading text-sm text-ink">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </p>
            <p className="mt-2 text-xs text-gray">Total</p>
            <p className="font-heading text-sm text-ink">{formatPrice(order.total)}</p>

            {order.trackingCode && (
              <div className="mt-4 border-t border-border pt-4 text-sm text-ink/80">
                <p>Transportadora: {order.carrier ?? "—"}</p>
                <p>Código de rastreio: {order.trackingCode}</p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline"
                  >
                    Rastrear no site da transportadora →
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="border border-border bg-surface p-6">
            <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
              Histórico
            </h3>
            <ol className="mt-4 space-y-4">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-4 text-sm">
                  <span className="w-32 shrink-0 text-xs text-gray">
                    {new Date(event.createdAt).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-ink">{event.message}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
