"use client";

import { useState, useTransition } from "react";
import { getProductShippingOptionsAction } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import type { ShippingOption } from "@/lib/shipping-rules";

/** Calculadora de frete da página do produto — tira a dúvida do frete antes do checkout. */
export default function ShippingEstimate({ productId }: { productId: string }) {
  const [zip, setZip] = useState("");
  const [isPending, startTransition] = useTransition();
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleZip(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setZip(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOptions(null);
    startTransition(async () => {
      const result = await getProductShippingOptionsAction(productId, zip);
      if (result.success) setOptions(result.data);
      else setError(result.error);
    });
  }

  return (
    <div className="mt-6 max-w-md border border-border bg-surface p-4">
      <p className="font-heading text-xs uppercase tracking-[0.14em] text-ink">Calcular frete e prazo</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Seu CEP"
          aria-label="CEP"
          value={zip}
          onChange={(e) => handleZip(e.target.value)}
          className="min-w-0 flex-1 border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={isPending || zip.replace(/\D/g, "").length !== 8}
          className="border border-ink px-4 py-2.5 font-heading text-xs uppercase tracking-[0.14em] text-ink hover:bg-[#F7F5F0] disabled:opacity-50"
        >
          {isPending ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {options && (
        <ul className="mt-3 space-y-2">
          {options.map((option) => (
            <li key={option.serviceId} className="flex items-baseline justify-between gap-3 text-sm text-ink">
              <span>
                {option.label}
                {option.deliveryDays > 0 && (
                  <span className="text-gray">
                    {" "}
                    · até {option.deliveryDays} {option.deliveryDays === 1 ? "dia útil" : "dias úteis"}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-heading">{option.free ? "Grátis" : formatPrice(option.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
