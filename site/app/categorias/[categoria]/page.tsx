import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogView from "@/components/produtos/CatalogView";
import { getCategories, getProductsByCategorySlug } from "@/lib/products";
import { getCategoryCopy } from "@/lib/category-copy";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categorias/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === categoria);
  if (!category) return {};

  const copy = getCategoryCopy(category.slug, category.name);
  const title = `${copy.metaTitle} | ${SITE_NAME}`;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `/categorias/${category.slug}` },
    openGraph: {
      title,
      description: copy.metaDescription,
      url: absoluteUrl(`/categorias/${category.slug}`),
    },
    twitter: { card: "summary", title, description: copy.metaDescription },
  };
}

export default async function CategoriaPage({
  params,
}: PageProps<"/categorias/[categoria]">) {
  const { categoria } = await params;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProductsByCategorySlug(categoria),
  ]);

  const activeCategory = categories.find((c) => c.slug === categoria);
  if (!activeCategory) notFound();

  const copy = getCategoryCopy(activeCategory.slug, activeCategory.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.h1,
    url: absoluteUrl(`/categorias/${activeCategory.slug}`),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/produtos/${product.slug}`),
        name: product.name,
      })),
    },
  };

  return (
    <section className="px-5 py-14 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-xs text-gray">Catálogo</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          {copy.h1}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-gray">{copy.intro}</p>

        <CatalogView categories={categories} activeCategory={activeCategory} products={products} />
      </div>
    </section>
  );
}
