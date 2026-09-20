import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Pedido confirmado", ...NOINDEX };

export default async function CheckoutSucessoPage({
  searchParams,
}: PageProps<"/checkout/sucesso">) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.order) ? params.order[0] : params.order;

  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } })
    : null;

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow text-xs text-gray">Pedido confirmado</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-ink">
          Pedido confirmado
        </h1>
        <p className="mt-3 text-ink/70">
          Sua compra foi registrada com sucesso. Você pode acompanhar o status pela sua conta.
        </p>

        {order && (
          <div className="mt-8 border border-border bg-surface p-6 text-left">
            <p className="text-sm text-gray">Número do pedido</p>
            <p className="font-heading text-lg text-ink">{order.orderNumber}</p>
            <p className="mt-4 text-sm text-gray">Status</p>
            <p className="font-heading text-sm text-ink">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </p>
            <p className="mt-4 text-sm text-gray">Total</p>
            <p className="font-heading text-lg text-ink">{formatPrice(Number(order.total))}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/minha-conta/pedidos"
            className="bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85"
          >
            Ver meus pedidos
          </Link>
          <Link
            href="/produtos"
            className="border border-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-ink hover:bg-[#F7F5F0]"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </section>
  );
}
