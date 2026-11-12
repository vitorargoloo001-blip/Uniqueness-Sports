import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import { ProductsTable } from "@/components/produtos/products-table";

export const metadata: Metadata = { title: "Produtos · Uniqueness Admin" };

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);

  const productsData = products.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground">Catálogo, preços, estoque e fotos.</p>
      </div>
      <ProductsTable products={productsData} categories={categories} />
    </div>
  );
}
