"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { updateCartItemQuantity, removeCartItem } from "@/lib/cart";
import CouponInput from "@/components/store/CouponInput";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number; stock: number; shortDescription: string | null };
};

export default function CartView({
  items,
  subtotal,
  coupon,
  discountTotal,
  total,
  couponError,
}: {
  items: CartItem[];
  subtotal: number;
  coupon: { code: string; type: "PERCENT" | "FIXED"; value: number } | null;
  discountTotal: number;
  total: number;
  couponError: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeQuantity(itemId: string, quantity: number) {
    startTransition(async () => {
      await updateCartItemQuantity(itemId, quantity);
      router.refresh();
    });
  }

  function remove(itemId: string) {
    startTransition(async () => {
      await removeCartItem(itemId);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 border border-border bg-surface p-12 text-center">
        <p className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Carrinho vazio</p>
        <p className="mt-2 text-ink/70">
          Seu carrinho ainda está vazio. Escolha seus produtos e monte sua rotina Uniqueness.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-block bg-ink px-7 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="divide-y divide-border border border-border bg-surface">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 sm:p-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-border bg-[#F7F5F0] p-2">
              <span className="text-center font-display text-[10px] uppercase leading-tight text-ink">
                {item.product.name}
              </span>
            </div>

            <div className="flex-1">
              <p className="font-heading text-sm uppercase text-ink">{item.product.name}</p>
              {item.product.shortDescription && (
                <p className="text-xs text-gray">{item.product.shortDescription}</p>
              )}
              <p className="mt-1 font-heading text-sm text-ink">
                {formatPrice(item.product.price)}
              </p>
            </div>

            <div className="flex items-center border border-border">
              <button
                type="button"
                disabled={isPending}
                onClick={() => changeQuantity(item.id, item.quantity - 1)}
                className="px-3 py-2 text-ink hover:bg-[#F7F5F0]"
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                disabled={isPending || item.quantity >= item.product.stock}
                onClick={() => changeQuantity(item.id, item.quantity + 1)}
                className="px-3 py-2 text-ink hover:bg-[#F7F5F0] disabled:opacity-30"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right font-heading text-sm text-ink">
              {formatPrice(item.product.price * item.quantity)}
            </p>

            <button
              type="button"
              disabled={isPending}
              onClick={() => remove(item.id)}
              aria-label="Remover item"
              className="text-gray hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <aside className="h-fit border border-border bg-surface p-6">
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Resumo do pedido
        </h2>

        {couponError && <p className="mt-3 text-xs text-red-600">{couponError}</p>}
        <CouponInput coupon={coupon} />

        <div className="mt-4 flex justify-between text-sm text-ink/80">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="mt-2 flex justify-between text-sm text-ink/80">
            <span>Desconto {coupon ? `(${coupon.code})` : ""}</span>
            <span>-{formatPrice(discountTotal)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between text-sm text-ink/80">
          <span>Frete</span>
          <span>Calculado no checkout</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-heading text-base text-ink">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="mt-2 text-xs text-gray">O valor do frete será calculado no checkout.</p>
        <Link
          href="/checkout"
          className="mt-6 block bg-ink px-6 py-3 text-center font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85"
        >
          Finalizar compra
        </Link>
        <p className="mt-3 text-center text-xs text-gray">Compra segura. Dados protegidos.</p>
      </aside>
    </div>
  );
}
