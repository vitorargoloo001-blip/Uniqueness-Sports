"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyCouponAction, removeCouponAction } from "@/lib/cart";

type AppliedCoupon = { code: string; type: "PERCENT" | "FIXED"; value: number } | null;

export default function CouponInput({
  coupon,
  couponError,
}: {
  coupon: AppliedCoupon;
  couponError?: string | null;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(couponError ?? null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function apply() {
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await applyCouponAction(code);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCode("");
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      await removeCouponAction();
      router.refresh();
    });
  }

  if (coupon) {
    return (
      <div className="mt-4 flex items-center justify-between gap-2 border border-ink bg-[#F7F5F0] px-3 py-2.5">
        <span className="text-sm text-ink">
          Cupom <strong className="font-heading">{coupon.code}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="shrink-0 text-xs text-gray underline hover:text-red-600"
        >
          Remover
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
          placeholder="Código do cupom"
          className="w-full border border-border bg-surface px-3 py-2.5 text-sm uppercase text-ink placeholder:normal-case focus:border-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={apply}
          disabled={isPending || !code.trim()}
          className="shrink-0 border border-ink px-4 text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-40"
        >
          {isPending ? "..." : "Aplicar"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
