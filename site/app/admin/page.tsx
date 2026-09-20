import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [orderCount, pendingCount, userCount, revenueAgg, lowStock] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, orderBy: { stock: "asc" } }),
  ]);

  const stats = [
    { label: "Pedidos", value: orderCount },
    { label: "Aguardando pagamento", value: pendingCount },
    { label: "Clientes", value: userCount },
    { label: "Faturamento (pago)", value: formatPrice(Number(revenueAgg._sum.total ?? 0)) },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.08em] text-gray">{stat.label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-border bg-surface p-6">
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Estoque baixo
        </h2>
        {lowStock.length === 0 ? (
          <p className="mt-3 text-sm text-gray">Nenhum produto com estoque baixo.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <Link href="/admin/produtos" className="text-ink hover:underline">
                  {p.name}
                </Link>
                <span className="text-red-600">{p.stock} unidade(s)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
