"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const outOfStock = stock <= 0;

  function handleAdd() {
    setMessage(null);
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      setMessage(
        result.success
          ? { type: "ok", text: "Adicionado ao carrinho." }
          : { type: "error", text: result.error },
      );
    });
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-8 inline-block cursor-not-allowed bg-ink/30 px-8 py-4 font-heading text-sm uppercase tracking-[0.18em] text-white"
      >
        Produto esgotado
      </button>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-3 text-ink hover:bg-[#F7F5F0]"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-10 text-center font-heading text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="px-4 py-3 text-ink hover:bg-[#F7F5F0]"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="flex-1 bg-ink px-8 py-4 font-heading text-sm uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {isPending ? "Adicionando..." : "Adicionar ao carrinho"}
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.type === "ok" ? "text-ink/70" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
