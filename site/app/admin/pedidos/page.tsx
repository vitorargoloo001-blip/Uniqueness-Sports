import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Pedidos" };

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Pedidos</h2>
      <div className="mt-4 overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-gray">
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
              <th className="p-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="p-4">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="font-heading text-ink hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="p-4 text-ink/70">{order.customerName}</td>
                <td className="p-4 text-ink/70">
                  {order.createdAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="p-4 text-ink/70">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </td>
                <td className="p-4 text-ink/70">{formatPrice(Number(order.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="p-6 text-sm text-gray">Nenhum pedido ainda.</p>
        )}
      </div>
    </div>
  );
}
