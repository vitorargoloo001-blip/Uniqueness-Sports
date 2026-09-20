"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Product } from "@/lib/products";
import { formatPrice, formatInstallments } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import OfferBadge from "@/components/OfferBadge";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 20s-7-4.35-9.5-8.5C.7 8.2 2.4 5 5.8 5c2 0 3.4 1.1 4.2 2.4C10.8 6.1 12.2 5 14.2 5c3.4 0 5.1 3.2 3.3 6.5C19 15.65 12 20 12 20Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const [fav, setFav] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const outOfStock = product.stock <= 0;
  const installments = formatInstallments(product.price);

  function handleAddToCart() {
    setMessage(null);
    startTransition(async () => {
      const result = await addToCart(product.id, 1);
      setMessage(
        result.success
          ? { type: "ok", text: "Adicionado ao carrinho" }
          : { type: "error", text: result.error },
      );
    });
  }

  return (
    <div className="reveal-item group relative flex flex-col border border-border bg-surface transition-shadow hover:shadow-[0_16px_32px_-16px_rgba(10,10,10,0.18)]">
      <button
        type="button"
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onClick={() => setFav((v) => !v)}
        className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-colors ${
          fav ? "text-ink" : "text-ink/50 hover:text-ink"
        }`}
      >
        <HeartIcon filled={fav} />
      </button>

      {outOfStock ? (
        <span className="eyebrow absolute left-3 top-3 z-10 bg-ink px-2 py-1 text-[10px] text-white">
          Esgotado
        </span>
      ) : (
        product.offer && <OfferBadge offer={product.offer} className="absolute left-3 top-3 z-10" />
      )}

      <Link href={`/produtos/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden border-b border-border bg-[#F7F5F0] px-6 transition-transform duration-300 group-hover:scale-[1.02]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={`${product.name} — Uniqueness Sports`}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-6"
            />
          ) : (
            <span className="text-center font-display text-xl uppercase leading-tight text-ink sm:text-2xl">
              {product.name}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="font-heading text-sm uppercase tracking-[0.02em] text-ink">
            {product.name}
          </h3>
          <p className="text-xs text-gray">{product.shortDescription}</p>
          <p className="mt-2 font-heading text-lg text-ink">
            {formatPrice(product.price)}
          </p>
          {installments && <p className="text-xs text-gray">{installments}</p>}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock || isPending}
        className="flex items-center justify-center gap-2 border-t border-border py-3 font-heading text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
      >
        <BagIcon />
        {outOfStock ? "Indisponível" : isPending ? "Adicionando..." : "Adicionar ao carrinho"}
      </button>

      {message && (
        <p
          className={`px-4 pb-3 text-center text-xs ${
            message.type === "ok" ? "text-ink/70" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
