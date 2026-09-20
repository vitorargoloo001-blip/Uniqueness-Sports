import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import OrderAdminPanel from "@/components/admin/OrderAdminPanel";

export const metadata: Metadata = { title: "Admin · Detalhe do pedido" };

export default async function AdminPedidoDetalhePage({
  params,
}: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Pedido {order.orderNumber}
        </h2>
        <p className="text-xs text-gray">
          {order.customerName} · {order.customerEmail} · {order.customerPhone}
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
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-heading text-base text-ink">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </div>

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

      <OrderAdminPanel
        orderId={order.id}
        currentStatus={order.status}
        carrier={order.carrier}
        trackingCode={order.trackingCode}
        trackingUrl={order.trackingUrl}
      />

      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">
          Pagamentos
        </h3>
        {order.payments.length === 0 ? (
          <p className="mt-3 text-sm text-gray">Nenhum registro de pagamento ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {order.payments.map((payment) => (
              <li key={payment.id} className="flex justify-between">
                <span>
                  {payment.provider} · {payment.status}
                  {payment.paymentMethod ? ` · ${payment.paymentMethod}` : ""}
                </span>
                <span>{formatPrice(Number(payment.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border bg-surface p-6">
        <h3 className="font-heading text-xs uppercase tracking-[0.1em] text-gray">Histórico</h3>
        <ol className="mt-4 space-y-3">
          {order.events.map((event) => (
            <li key={event.id} className="flex gap-4 text-sm">
              <span className="w-40 shrink-0 text-xs text-gray">
                {event.createdAt.toLocaleString("pt-BR")}
              </span>
              <span className="text-ink">{event.message}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
