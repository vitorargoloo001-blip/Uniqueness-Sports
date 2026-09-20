import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/lib/products";

export default async function BestSellers() {
  const products = await getAllProducts();

  return (
    <section className="border-b border-border bg-bg px-5 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl uppercase text-ink md:text-4xl">
              Mais vendidos
            </h2>
            <p className="mt-2 text-sm text-gray">
              Produtos escolhidos por quem leva o treino a sério.
            </p>
          </div>
          <Link
            href="/produtos"
            className="hidden font-heading text-xs uppercase tracking-[0.14em] text-gray hover:text-ink sm:block"
          >
            Ver todos os produtos →
          </Link>
        </div>

        <Reveal className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Reveal>

        <Link
          href="/produtos"
          className="mt-8 block text-center font-heading text-xs uppercase tracking-[0.14em] text-gray hover:text-ink sm:hidden"
        >
          Ver todos os produtos →
        </Link>
      </div>
    </section>
  );
}
