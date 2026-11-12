import type { Metadata } from "next";
import { listCoupons } from "@/lib/coupons";
import { listProducts } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import { CouponsTable } from "@/components/cupons/coupons-table";

export const metadata: Metadata = { title: "Cupons · Uniqueness Admin" };

export default async function CuponsPage() {
  const [coupons, products, categories] = await Promise.all([
    listCoupons(),
    listProducts(),
    listCategories(),
  ]);

  const data = coupons.map((c) => ({
    ...c,
    value: Number(c.value),
    minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cupons</h1>
        <p className="text-sm text-muted-foreground">
          Descontos configurados na loja — aplicáveis à loja inteira, a um produto ou a uma categoria
          específica. O cliente aplica o código no carrinho ou no checkout do site; cupons de loja inteira
          também aparecem numa faixa de aviso no topo do site enquanto estiverem ativos.
        </p>
      </div>
      <CouponsTable
        coupons={data}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
