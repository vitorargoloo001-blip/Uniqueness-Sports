import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrders, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export default async function MinhaContaPage() {
  const session = await auth();
  const orders = session?.user?.id ? await getUserOrders(session.user.id) : [];
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <p className="-mt-2 text-sm text-gray">
        Gerencie seus dados, endereços, pedidos e preferências de compra.
      </p>

      <div className="border border-border bg-surface p-6">
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Pedidos recentes
        </h2>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-gray">Você ainda não fez nenhum pedido.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/minha-conta/pedidos/${order.id}`}
                    className="font-heading text-sm text-ink hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-gray">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
                <p className="font-heading text-sm text-ink">
                  {formatPrice(Number(order.total))}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/minha-conta/pedidos"
          className="mt-4 inline-block font-heading text-xs uppercase tracking-[0.14em] text-ink hover:underline"
        >
          Ver todos os pedidos →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/minha-conta/dados"
          className="border border-border bg-surface p-6 hover:border-ink"
        >
          <p className="font-heading text-sm uppercase text-ink">Meus dados</p>
          <p className="mt-1 text-sm text-gray">Nome, telefone, CPF e email.</p>
        </Link>
        <Link
          href="/minha-conta/enderecos"
          className="border border-border bg-surface p-6 hover:border-ink"
        >
          <p className="font-heading text-sm uppercase text-ink">Endereços</p>
          <p className="mt-1 text-sm text-gray">Gerencie seus endereços de entrega.</p>
        </Link>
      </div>
    </div>
  );
}
