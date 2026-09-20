import "server-only";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import type { Coupon } from "@/lib/generated/prisma/client";

export type DiscountLine = { productId: string; categoryId: string | null; price: number; quantity: number };

type ValidateResult =
  | { success: true; coupon: Coupon }
  | { success: false; error: string };

/**
 * Confere se um código de cupom pode ser aplicado agora, contra o
 * conteúdo real do carrinho — ativo, dentro da janela de validade, dentro
 * do limite de usos, pedido mínimo atingido, e (se o cupom tem escopo de
 * produto/categoria) que o carrinho realmente tem algo elegível. Nunca
 * confiar num desconto calculado no cliente — sempre revalidar aqui.
 */
export async function validateCoupon(
  rawCode: string,
  items: DiscountLine[],
): Promise<ValidateResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { success: false, error: "Informe um código de cupom" };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { success: false, error: "Cupom não encontrado" };
  if (!coupon.isActive) return { success: false, error: "Esse cupom não está mais ativo" };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { success: false, error: "Esse cupom ainda não é válido" };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { success: false, error: "Esse cupom expirou" };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { success: false, error: "Esse cupom já atingiu o limite de usos" };
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    return {
      success: false,
      error: `Pedido mínimo de ${formatPrice(Number(coupon.minOrderValue))} pra usar esse cupom`,
    };
  }

  if (coupon.productId && !items.some((i) => i.productId === coupon.productId)) {
    return { success: false, error: "Esse cupom não se aplica aos produtos do seu carrinho" };
  }
  if (coupon.categoryId && !items.some((i) => i.categoryId === coupon.categoryId)) {
    return { success: false, error: "Esse cupom não se aplica aos produtos do seu carrinho" };
  }

  return { success: true, coupon };
}

/**
 * Valor do desconto pro carrinho atual — percentual ou fixo aplicado só
 * sobre a parte elegível (o produto/categoria do cupom, ou tudo se for
 * loja inteira), nunca maior que essa parte elegível.
 */
export function calculateDiscount(coupon: Coupon, items: DiscountLine[]): number {
  const eligible = coupon.productId
    ? items.filter((i) => i.productId === coupon.productId)
    : coupon.categoryId
      ? items.filter((i) => i.categoryId === coupon.categoryId)
      : items;

  const eligibleTotal = eligible.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (eligibleTotal <= 0) return 0;

  const raw = coupon.type === "PERCENT" ? eligibleTotal * (Number(coupon.value) / 100) : Number(coupon.value);
  return Math.min(raw, eligibleTotal);
}

/** Cupom store-wide (sem produto/categoria) mais próximo de expirar — pra faixa de anúncio. */
export async function getActiveStoreCoupon() {
  const now = new Date();
  return prisma.coupon.findFirst({
    where: {
      isActive: true,
      productId: null,
      categoryId: null,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    },
    orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }],
  });
}

/** Cupons ativos com escopo de produto/categoria — pra badge de oferta no catálogo. */
export async function getActiveScopedCoupons() {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ productId: { not: null } }, { categoryId: { not: null } }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
  });
}
