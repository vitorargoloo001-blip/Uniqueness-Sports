import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import CartView from "@/components/store/CartView";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seu carrinho",
  ...NOINDEX,
};

export default async function CarrinhoPage() {
  const cart = await getCart();

  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-gray">Compras</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          Seu carrinho
        </h1>

        <CartView
          items={cart.items}
          subtotal={cart.subtotal}
          coupon={cart.coupon}
          discountTotal={cart.discountTotal}
          total={cart.total}
          couponError={cart.couponError}
        />
      </div>
    </section>
  );
}
