"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, type ShippingOption } from "@/lib/shipping-rules";

type CheckoutShippingState = {
  selected: ShippingOption | null;
  setSelected: (option: ShippingOption | null) => void;
};

const CheckoutShippingContext = createContext<CheckoutShippingState | null>(null);

/** Leva o frete escolhido no CheckoutForm até o resumo do pedido (irmãos na página). */
export function CheckoutShippingProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<ShippingOption | null>(null);
  return <CheckoutShippingContext value={{ selected, setSelected }}>{children}</CheckoutShippingContext>;
}

export function useCheckoutShipping() {
  const context = useContext(CheckoutShippingContext);
  if (!context) throw new Error("useCheckoutShipping precisa estar dentro de CheckoutShippingProvider");
  return context;
}

export function CheckoutTotals({
  subtotal,
  discountTotal,
  couponCode,
}: {
  subtotal: number;
  discountTotal: number;
  couponCode: string | null;
}) {
  const { selected } = useCheckoutShipping();
  // Mesma conta de createOrderFromCart (lib/orders.ts).
  const total = Math.max(0, subtotal + (selected?.price ?? 0) - discountTotal);
  const missingForFreeShipping = FREE_SHIPPING_THRESHOLD - Math.max(0, subtotal - discountTotal);

  return (
    <>
      <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm text-ink/80">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between">
            <span>Desconto {couponCode ? `(${couponCode})` : ""}</span>
            <span>-{formatPrice(discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{selected ? (selected.free ? "Grátis" : formatPrice(selected.price)) : "Informe o CEP"}</span>
        </div>
        {missingForFreeShipping > 0 && (
          <p className="text-xs text-gray">
            Faltam {formatPrice(missingForFreeShipping)} para frete grátis.
          </p>
        )}
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-4 font-heading text-base text-ink">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </>
  );
}
