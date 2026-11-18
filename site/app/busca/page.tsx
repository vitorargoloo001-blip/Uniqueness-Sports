import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { searchProducts } from "@/lib/products";
import { NOINDEX } from "@/lib/seo";
import MetaPixelEvent from "@/components/MetaPixelEvent";

export const metadata: Metadata = { title: "Busca", ...NOINDEX };

export default async function BuscaPage({ searchParams }: PageProps<"/busca">) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim();
  const products = query ? await searchProducts(query) : [];

  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-7xl">
        {query && (
          // key = termo: uma busca nova na mesma página remonta e dispara de novo.
          <MetaPixelEvent
            key={query}
            event="Search"
            data={{ search_string: query, content_ids: products.map((p) => p.id), content_type: "product" }}
          />
        )}
        <p className="eyebrow text-xs text-gray">Busca</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-ink md:text-4xl">
          {query ? (
            <>
              Resultados para <span className="text-ink/60">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Buscar produtos"
          )}
        </h1>
        {query && (
          <p className="mt-3 text-sm text-gray">
            {products.length === 0
              ? "Nenhum produto encontrado."
              : `${products.length} produto${products.length > 1 ? "s" : ""} encontrado${products.length > 1 ? "s" : ""}.`}
          </p>
        )}

        {products.length > 0 ? (
          <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </Reveal>
        ) : (
          <div className="mt-10 border border-border bg-surface p-8 text-center">
            <p className="text-ink/70">
              {query
                ? "Tenta buscar por outro termo — nome do produto ou categoria (ex.: creatina, camiseta, shaker)."
                : "Digite algo na busca do menu pra encontrar produtos."}
            </p>
            <Link
              href="/produtos"
              className="mt-6 inline-block border border-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-ink hover:bg-[#F7F5F0]"
            >
              Ver todos os produtos
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
