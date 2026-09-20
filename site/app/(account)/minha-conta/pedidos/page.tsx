import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrders, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function PedidosPage() {
  const session = await auth();
  const orders = await getUserOrders(session!.user.id);

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Meus pedidos</h2>
      <p className="mt-1 text-sm text-gray">
        Acompanhe suas compras e veja o status de cada pedido.
      </p>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-gray">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div className="mt-4 divide-y divide-border border border-border bg-surface">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/minha-conta/pedidos/${order.id}`}
              className="flex flex-col gap-1 p-5 hover:bg-[#F7F5F0] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-heading text-sm text-ink">{order.orderNumber}</p>
                <p className="text-xs text-gray">
                  {order.createdAt.toLocaleDateString("pt-BR")} ·{" "}
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
              <p className="font-heading text-sm text-ink">
                {formatPrice(Number(order.total))} · {order.items.length} item(ns)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
