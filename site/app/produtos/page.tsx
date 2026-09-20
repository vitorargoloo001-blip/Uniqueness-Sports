import type { Metadata } from "next";
import CatalogView from "@/components/produtos/CatalogView";
import { getCategories, getAllProducts } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Suplementos, roupas, acessórios e coqueteleiras Uniqueness Sports. Catálogo completo pra quem treina de verdade — compra segura e entrega pra todo o Brasil.",
  alternates: { canonical: "/produtos" },
  openGraph: {
    title: "Produtos — Uniqueness Sports",
    description: "Suplementos, roupas, acessórios e coqueteleiras Uniqueness Sports.",
    url: absoluteUrl("/produtos"),
  },
};

export default async function ProdutosPage() {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-xs text-gray">Catálogo</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          Produtos
        </h1>
        <p className="mt-3 max-w-lg text-sm text-gray">
          Suplementos, roupas, acessórios e coqueteleiras — tudo em um só lugar,
          sem hype e sem enrolação.
        </p>

        <CatalogView categories={categories} products={products} />
      </div>
    </section>
  );
}
