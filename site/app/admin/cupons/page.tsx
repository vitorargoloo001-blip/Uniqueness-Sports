import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin · Cupons" };

export default function AdminCuponsPage() {
  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Cupons</h2>
      <div className="mt-4 border border-border bg-surface p-6">
        <p className="text-sm text-ink/80">
          Cupons ainda não têm um model no banco de dados — o checkout já
          reserva o campo <code>discountTotal</code> no pedido pra quando
          isso for implementado.
        </p>
        <p className="mt-3 text-sm text-gray">
          Pra ativar: criar um model <code>Coupon</code> no Prisma schema
          (código, tipo de desconto, validade, uso máximo), aplicar no
          carrinho/checkout e then popular essa tela com CRUD real.
        </p>
      </div>
    </div>
  );
}
