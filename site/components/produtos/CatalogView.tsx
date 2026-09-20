import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";
import type { Category } from "@/lib/generated/prisma/client";

export default function CatalogView({
  categories,
  activeCategory,
  products,
}: {
  categories: Category[];
  activeCategory?: Category;
  products: Product[];
}) {
  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/produtos"
          className={`border px-4 py-2 font-heading text-xs uppercase tracking-[0.14em] ${
            !activeCategory
              ? "border-ink bg-ink text-white"
              : "border-border text-ink/70 hover:border-ink"
          }`}
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categorias/${cat.slug}`}
            className={`border px-4 py-2 font-heading text-xs uppercase tracking-[0.14em] ${
              activeCategory?.slug === cat.slug
                ? "border-ink bg-ink text-white"
                : "border-border text-ink/70 hover:border-ink"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </Reveal>

      {products.length === 0 && (
        <p className="mt-10 text-gray">Nenhum produto nessa categoria ainda.</p>
      )}
    </>
  );
}
