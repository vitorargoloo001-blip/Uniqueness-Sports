import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getActiveScopedCoupons } from "@/lib/coupons";
import type { Product as DbProduct, Category as DbCategory } from "@/lib/generated/prisma/client";

export type ProductOffer = { code: string; type: "PERCENT" | "FIXED"; value: number };

export type Product = Omit<DbProduct, "price" | "compareAtPrice"> & {
  price: number;
  compareAtPrice: number | null;
  category: DbCategory | null;
  offer: ProductOffer | null;
};

/**
 * imageUrl pode ser um caminho local (public/, legado do seed original —
 * bom quando o arquivo existe, senão cai pro placeholder, nunca quebra a
 * página com 404) ou uma URL absoluta do Supabase Storage (upload feito
 * pelo painel admin — outro projeto/domínio, então essa sempre é confiada
 * direto, sem checar o filesystem local).
 */
function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return existsSync(join(process.cwd(), "public", imageUrl)) ? imageUrl : null;
}

/**
 * Decimal (Prisma) não é serializável na fronteira Server -> Client
 * Component — converter pra number aqui, na camada de dados, evita
 * esquecer isso em cada chamador.
 */
function serializeProduct(
  product: DbProduct & { category: DbCategory | null },
): Omit<Product, "offer"> {
  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    imageUrl: resolveImageUrl(product.imageUrl),
  };
}

/**
 * Casa cada produto com um cupom ativo de produto/categoria (se houver) —
 * é o que alimenta o selo "Oferta" no catálogo. Uma consulta só pros
 * cupons ativos, reaproveitada pra lista inteira (sem N+1).
 */
async function attachOffers<T extends Omit<Product, "offer"> & { categoryId: string | null }>(
  products: T[],
): Promise<(T & { offer: ProductOffer | null })[]> {
  const coupons = await getActiveScopedCoupons();
  if (coupons.length === 0) return products.map((p) => ({ ...p, offer: null }));

  return products.map((p) => {
    const match = coupons.find((c) => c.productId === p.id || c.categoryId === p.categoryId);
    return {
      ...p,
      offer: match ? { code: match.code, type: match.type, value: Number(match.value) } : null,
    };
  });
}

export async function getAllProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  return attachOffers(products.map(serializeProduct));
}

export async function getProductsByCategorySlug(
  categorySlug?: string,
): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  return attachOffers(products.map(serializeProduct));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) return null;
  const [withOffer] = await attachOffers([serializeProduct(product)]);
  return withOffer;
}

export async function getCategories(): Promise<DbCategory[]> {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  return attachOffers(products.map(serializeProduct));
}
