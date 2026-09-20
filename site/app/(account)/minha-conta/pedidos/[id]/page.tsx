import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Detalhes do pedido" };

export default async function PedidoDetalhePage({
  params,
}: PageProps<"/minha-conta/pedidos/[id]">) {
  const { id } = await params;
  const session = await auth();
  const order = await getOrderById(id);

  if (!order || order.userId !== session!.user.id) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Pedido {order.orderNumber}
        </h2>
        <p className="text-xs text-gray">
          Feito em {order.createdAt.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">Itens</h3>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-sm text-ink">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatPrice(Number(item.total))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-ink/80">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span>{formatPrice(Number(order.shippingTotal))}</span>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between">
              <span>Desconto</span>
              <span>-{formatPrice(Number(order.discountTotal))}</span>
            </div>
          )}
          <div className="flex justify-between font-heading text-base text-ink">
            <span>Total</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="border border-border bg-surface p-6">
          <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
            Endereço de entrega
          </h3>
          <p className="mt-3 text-sm text-ink/80">
            {order.shippingStreet}, {order.shippingNumber}
            {order.shippingComplement ? ` — ${order.shippingComplement}` : ""}
            <br />
            {order.shippingDistrict}, {order.shippingCity} - {order.shippingState}
            <br />
            CEP {order.shippingZipCode}
          </p>
        </div>

        <div className="border border-border bg-surface p-6">
          <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
            Rastreamento
          </h3>
          {order.trackingCode ? (
            <div className="mt-3 space-y-1 text-sm text-ink/80">
              <p>Transportadora: {order.carrier ?? "—"}</p>
              <p>Código: {order.trackingCode}</p>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-ink underline"
                >
                  Rastrear entrega →
                </a>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray">
              Código de rastreio ainda não disponível.
            </p>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
          Histórico do pedido
        </h3>
        <ol className="mt-4 space-y-4">
          {order.events.map((event) => (
            <li key={event.id} className="flex gap-4 text-sm">
              <span className="w-32 shrink-0 text-xs text-gray">
                {event.createdAt.toLocaleString("pt-BR")}
              </span>
              <span className="text-ink">
                {ORDER_STATUS_LABELS[event.status] ?? event.message}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
