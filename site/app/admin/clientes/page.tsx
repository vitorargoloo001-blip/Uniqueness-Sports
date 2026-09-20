import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin · Clientes" };

export default async function AdminClientesPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Clientes</h2>
      <div className="mt-4 overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-gray">
              <th className="p-4">Nome</th>
              <th className="p-4">Email</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Pedidos</th>
              <th className="p-4">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-4 font-heading text-ink">{c.name ?? "—"}</td>
                <td className="p-4 text-ink/70">{c.email}</td>
                <td className="p-4 text-ink/70">{c.phone ?? "—"}</td>
                <td className="p-4 text-ink/70">{c._count.orders}</td>
                <td className="p-4 text-ink/70">{c.createdAt.toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="p-6 text-sm text-gray">Nenhum cliente cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
