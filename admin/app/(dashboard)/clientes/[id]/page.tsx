import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/status";

export const metadata: Metadata = { title: "Cliente · Uniqueness Admin" };

export default async function ClienteDetalhePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{customer.name ?? customer.email}</h1>
        <p className="text-sm text-muted-foreground">
          {customer.email}
          {customer.phone ? ` · ${customer.phone}` : ""}
          {customer.cpf ? ` · CPF ${customer.cpf}` : ""} · cliente desde {formatDate(customer.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Endereços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
            ) : (
              customer.addresses.map((address) => (
                <div key={address.id} className="rounded-md border border-border p-3 text-sm">
                  {address.isDefault && (
                    <span className="mb-1 inline-block text-xs font-medium text-muted-foreground">Padrão</span>
                  )}
                  <p className="text-foreground">
                    {address.street}, {address.number}
                    {address.complement ? ` — ${address.complement}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {address.district}, {address.city} - {address.state} · CEP {address.zipCode}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {customer.orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/pedidos/${order.id}`} className="font-medium text-foreground hover:underline">
                        {order.orderNumber}
                      </Link>
                      <div className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                        variant={ORDER_STATUS_VARIANT[order.status] ?? "neutral"}
                      />
                      <span className="text-foreground">{formatPrice(Number(order.total))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
