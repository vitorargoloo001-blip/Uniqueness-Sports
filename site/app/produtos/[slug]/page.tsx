import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductBySlug } from "@/lib/products";
import { getProductCopy } from "@/lib/product-copy";
import { formatPrice, formatInstallments } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping-rules";
import AddToCartButton from "@/components/AddToCartButton";
import ShippingEstimate from "@/components/ShippingEstimate";
import OfferBadge from "@/components/OfferBadge";
import MetaPixelEvent from "@/components/MetaPixelEvent";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const copy = getProductCopy(slug, product);
  const title = `${copy.metaTitle} | ${SITE_NAME}`;
  const url = absoluteUrl(`/produtos/${product.slug}`);

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      title,
      description: copy.metaDescription,
      url,
      type: "website",
      ...(product.imageUrl ? { images: [{ url: absoluteUrl(product.imageUrl) }] } : {}),
    },
    twitter: {
      card: product.imageUrl ? "summary_large_image" : "summary",
      title,
      description: copy.metaDescription,
    },
  };
}

export default async function ProdutoPage({
  params,
}: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const copy = getProductCopy(slug, product);
  const installments = formatInstallments(product.price);
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: copy.h1,
    description: copy.metaDescription,
    sku: product.sku ?? product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.imageUrl ? { image: [absoluteUrl(product.imageUrl)] } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produtos/${product.slug}`),
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <section className="px-5 py-14 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MetaPixelEvent
        event="ViewContent"
        data={{
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: product.price,
          currency: "BRL",
        }}
      />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="font-heading text-xs uppercase tracking-[0.14em] text-gray">
          <Link href="/produtos" className="hover:text-ink">
            Catálogo
          </Link>
          {product.category && (
            <>
              {" / "}
              <Link href={`/categorias/${product.category.slug}`} className="hover:text-ink">
                {product.category.name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-ink/60">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-start">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-border bg-surface px-8">
            {product.offer && <OfferBadge offer={product.offer} className="absolute left-3 top-3 z-10" />}
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={`${copy.h1} — Uniqueness Sports`}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain p-10"
                priority
              />
            ) : (
              <span className="text-center font-display text-3xl uppercase leading-none text-ink">
                {product.name}
              </span>
            )}
          </div>

          <div>
            {product.category && (
              <p className="eyebrow text-xs text-gray">{product.category.name}</p>
            )}
            <h1 className="mt-2 font-display text-3xl uppercase text-ink md:text-4xl">
              {copy.h1}
            </h1>
            {copy.shortDescription && (
              <p className="mt-1 text-sm text-gray">{copy.shortDescription}</p>
            )}

            {discountPercent > 0 && product.compareAtPrice && (
              <p className="mt-6 flex items-center gap-2 text-sm text-gray">
                <span className="line-through">De {formatPrice(product.compareAtPrice)}</span>
                <span className="eyebrow bg-black px-2 py-1 text-[10px] text-white">{discountPercent}% OFF</span>
              </p>
            )}
            <p className={`${discountPercent > 0 ? "mt-1" : "mt-6"} font-heading text-3xl text-ink`}>
              {formatPrice(product.price)}
            </p>
            {installments && <p className="mt-1 text-sm text-gray">{installments}</p>}
            {product.offer && (
              <p className="mt-2 text-sm text-ink">
                Use o cupom <strong className="font-heading">{product.offer.code}</strong> e ganhe{" "}
                {product.offer.type === "PERCENT" ? `${product.offer.value}%` : formatPrice(product.offer.value)}{" "}
                de desconto nesse produto.
              </p>
            )}

            <AddToCartButton productId={product.id} stock={product.stock} price={product.price} />

            <ul className="mt-4 space-y-1 text-xs text-gray">
              {product.stock > 0 && product.stock <= 5 && (
                <li className="text-ink/80">Apenas {product.stock} unidade(s) em estoque.</li>
              )}
              <li>Pix, cartão ou boleto — pagamento seguro pelo Mercado Pago, sem sair do site.</li>
              <li>Entrega para todo o Brasil. Frete grátis acima de {formatPrice(FREE_SHIPPING_THRESHOLD)}.</li>
              <li>Dúvidas? É só chamar no WhatsApp.</li>
            </ul>

            {product.stock > 0 && <ShippingEstimate productId={product.id} />}

            {copy.description && (
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink/80">
                {copy.description}
              </p>
            )}

            {copy.bullets.length > 0 && (
              <ul className="mt-5 max-w-md space-y-1.5 text-sm text-ink/80">
                {copy.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
