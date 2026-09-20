import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductsTable from "@/components/admin/ProductsTable";

export const metadata: Metadata = { title: "Admin · Produtos" };

export default async function AdminProdutosPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    stock: p.stock,
    isActive: p.isActive,
    category: p.category ? { name: p.category.name } : null,
  }));

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Produtos</h2>
      <div className="mt-4">
        <ProductsTable products={rows} />
      </div>
    </div>
  );
}
