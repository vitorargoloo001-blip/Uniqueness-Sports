import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import CheckoutForm from "@/components/store/CheckoutForm";
import CouponInput from "@/components/store/CouponInput";
import { CheckoutShippingProvider, CheckoutTotals } from "@/components/store/CheckoutShipping";
import MetaPixelEvent from "@/components/MetaPixelEvent";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Finalizar compra",
  ...NOINDEX,
};

export default async function CheckoutPage() {
  const [session, cart] = await Promise.all([auth(), getCart()]);

  if (cart.items.length === 0) {
    redirect("/carrinho");
  }

  let defaultValues = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCpf: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    shippingServiceId: 0,
  };

  if (session?.user?.id) {
    const [user, defaultAddress] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.address.findFirst({
        where: { userId: session.user.id, isDefault: true },
      }),
    ]);

    defaultValues = {
      customerName: user?.name ?? "",
      customerEmail: user?.email ?? "",
      customerPhone: user?.phone ?? "",
      customerCpf: user?.cpf ?? "",
      zipCode: defaultAddress?.zipCode ?? "",
      street: defaultAddress?.street ?? "",
      number: defaultAddress?.number ?? "",
      complement: defaultAddress?.complement ?? "",
      district: defaultAddress?.district ?? "",
      city: defaultAddress?.city ?? "",
      state: defaultAddress?.state ?? "",
      shippingServiceId: 0,
    };
  }

  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-6xl">
        <MetaPixelEvent
          event="InitiateCheckout"
          data={{
            value: cart.total,
            currency: "BRL",
            num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            contents: cart.items.map((item) => ({
              id: item.productId,
              quantity: item.quantity,
              item_price: item.product.price,
            })),
          }}
        />
        <p className="eyebrow text-xs text-gray">Compras</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          Finalizar compra
        </h1>

        <CheckoutShippingProvider>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <CheckoutForm
              defaultValues={defaultValues}
              isLoggedIn={Boolean(session?.user?.id)}
              cartTotal={cart.total}
            />

            <aside className="h-fit border border-border bg-surface p-6">
              <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
                Resumo do pedido
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>
                      {item.quantity}× {item.product.name}
                    </span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              {cart.couponError && <p className="mt-3 text-xs text-red-600">{cart.couponError}</p>}
              <CouponInput coupon={cart.coupon} />

              <CheckoutTotals
                subtotal={cart.subtotal}
                discountTotal={cart.discountTotal}
                couponCode={cart.coupon?.code ?? null}
              />
              <p className="mt-4 text-xs text-gray">
                Pagamento processado com segurança pelo Mercado Pago, sem sair do site. Seus dados
                não ficam armazenados na Uniqueness Sports.
              </p>
            </aside>
          </div>
        </CheckoutShippingProvider>
      </div>
    </section>
  );
}
