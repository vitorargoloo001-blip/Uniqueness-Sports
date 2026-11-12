"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { trackEvent } from "@/lib/meta-pixel";

export default function AddToCartButton({
  productId,
  stock,
  price,
}: {
  productId: string;
  stock: number;
  price: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"add" | "buy" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Barra fixa de compra no celular: aparece só quando os botões principais
  // saem da tela, pra não duplicar o CTA.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsVisible, setActionsVisible] = useState(true);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const outOfStock = stock <= 0;

  function handle(action: "add" | "buy") {
    setMessage(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      trackEvent("AddToCart", {
        content_ids: [productId],
        content_type: "product",
        value: price * quantity,
        currency: "BRL",
      });
      if (action === "buy") {
        router.push("/checkout");
      } else {
        setMessage({ type: "ok", text: "Adicionado ao carrinho." });
      }
    });
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-6 inline-block cursor-not-allowed bg-ink/30 px-8 py-4 font-heading text-sm uppercase tracking-[0.18em] text-white"
      >
        Produto esgotado
      </button>
    );
  }

  const buying = isPending && pendingAction === "buy";
  const adding = isPending && pendingAction === "add";

  return (
    <div className="mt-6">
      <div ref={actionsRef}>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-3 text-ink hover:bg-[#F7F5F0]"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="w-8 text-center font-heading text-sm">{quantity}</span>
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
            onClick={() => handle("buy")}
            disabled={isPending}
            className="flex-1 bg-ink px-6 py-4 font-heading text-sm uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {buying ? "Abrindo..." : "Comprar agora"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => handle("add")}
          disabled={isPending}
          className="mt-3 w-full border border-ink px-6 py-3.5 font-heading text-xs uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[#F7F5F0] disabled:opacity-60"
        >
          {adding ? "Adicionando..." : "Adicionar ao carrinho"}
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.type === "ok" ? "text-ink/70" : "text-red-600"}`}>
          {message.text}{" "}
          {message.type === "ok" && (
            <Link href="/carrinho" className="font-heading text-ink underline underline-offset-4">
              Ver carrinho →
            </Link>
          )}
        </p>
      )}

      {!actionsVisible && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-border bg-white px-5 py-3 md:hidden">
          <p className="font-heading text-lg text-ink">{formatPrice(price * quantity)}</p>
          <button
            type="button"
            onClick={() => handle("buy")}
            disabled={isPending}
            className="flex-1 bg-ink px-6 py-3.5 font-heading text-sm uppercase tracking-[0.18em] text-white disabled:opacity-60"
          >
            {buying ? "Abrindo..." : "Comprar agora"}
          </button>
        </div>
      )}
    </div>
  );
}
