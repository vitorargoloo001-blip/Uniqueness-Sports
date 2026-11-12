import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { getBalance } from "@/lib/melhor-envio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { OrderAdminPanel } from "@/components/pedidos/order-admin-panel";
import { ShippingLabelPanel } from "@/components/pedidos/shipping-label-panel";
import { OrderPaymentsPanel } from "@/components/pedidos/order-payments-panel";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANT,
} from "@/lib/status";

export const metadata: Metadata = { title: "Pedido · Uniqueness Admin" };

export default async function PedidoDetalhePage({ params }: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const balance = await getBalance();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.customerName} · {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge
            label={ORDER_STATUS_LABELS[order.status] ?? order.status}
            variant={ORDER_STATUS_VARIANT[order.status] ?? "neutral"}
          />
          <StatusBadge
            label={PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            variant={PAYMENT_STATUS_VARIANT[order.paymentStatus] ?? "neutral"}
          />
        </div>
      </div>

      <OrderAdminPanel
        orderId={order.id}
        currentStatus={order.status}
        carrier={order.carrier}
        trackingCode={order.trackingCode}
        trackingUrl={order.trackingUrl}
      />

      <ShippingLabelPanel
        orderId={order.id}
        shipmentId={order.melhorEnvioId}
        shippingStatus={order.shippingStatus}
        shippingError={order.shippingError}
        carrier={order.carrier}
        trackingCode={order.trackingCode}
        trackingUrl={order.trackingUrl}
        balance={balance.success ? balance.data.balance : null}
        balanceError={balance.success ? null : balance.error}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between py-2 text-sm">
                  <span className="text-foreground">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-muted-foreground">{formatPrice(Number(item.total))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto {order.coupon ? `(${order.coupon.code})` : ""}</span>
                  <span>-{formatPrice(Number(order.discountTotal))}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>{formatPrice(Number(order.shippingTotal))}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p>
                {order.shippingStreet}, {order.shippingNumber}
                {order.shippingComplement ? ` — ${order.shippingComplement}` : ""}
              </p>
              <p>
                {order.shippingDistrict}, {order.shippingCity} - {order.shippingState}
              </p>
              <p>CEP {order.shippingZipCode}</p>
            </div>
            {order.shippingServiceId && (
              <div className="border-t border-border pt-3 text-foreground">
                {order.carrier}
                {order.shippingDeliveryDays ? ` · até ${order.shippingDeliveryDays} dias úteis` : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campo a campo de propósito: espalhar a linha do Prisma levaria o
          Decimal de `amount` cru pro Client Component e quebra em runtime. */}
      <OrderPaymentsPanel
        payments={order.payments.map((payment) => ({
          id: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          status: payment.status,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt?.toISOString() ?? null,
          createdAt: payment.createdAt.toISOString(),
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {order.events.map((event) => (
              <li key={event.id} className="flex gap-4 text-sm">
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </span>
                <span className="text-foreground">{event.message}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
