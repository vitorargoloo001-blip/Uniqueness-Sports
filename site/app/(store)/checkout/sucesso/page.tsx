import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import MetaPixelEvent from "@/components/MetaPixelEvent";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Pedido confirmado", ...NOINDEX };

export default async function CheckoutSucessoPage({
  searchParams,
}: PageProps<"/checkout/sucesso">) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.order) ? params.order[0] : params.order;

  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : null;

  // Mesmo id de conteúdo usado pela API de Conversões (apply-event.ts) e pelos
  // eventos ViewContent/AddToCart (productId) — sem isso a Meta não liga a
  // compra aos produtos do catálogo.
  const purchaseContents = (order?.items ?? []).map((item) => ({
    id: item.productId ?? item.sku ?? item.id,
    quantity: item.quantity,
    item_price: Number(item.unitPrice),
  }));

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-md text-center">
        {order && order.status === "PAID" && (
          // eventId = orderNumber: mesmo ID do Purchase enviado pela API de
          // Conversões em apply-event.ts, pra deduplicar os dois no Meta.
          <MetaPixelEvent
            event="Purchase"
            eventId={order.orderNumber}
            data={{
              value: Number(order.total),
              currency: "BRL",
              order_id: order.orderNumber,
              content_type: "product",
              content_ids: purchaseContents.map((c) => c.id),
              contents: purchaseContents,
              num_items: purchaseContents.reduce((sum, c) => sum + c.quantity, 0),
            }}
          />
        )}
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
