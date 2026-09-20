/**
 * Utilitários puros de formatação — sem import de Prisma/DB, seguro pra
 * usar em Client Components. Consultas ao banco ficam em lib/products.ts.
 */

export function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Parcelamento exibido nos cards — calculado a partir do preço (sem juros). */
export function formatInstallments(price: number, maxInstallments = 3) {
  const installments = price >= 100 ? maxInstallments : Math.min(maxInstallments, 2);
  if (price < 20 || installments < 2) return null;
  return `ou ${installments}x de ${formatPrice(price / installments)} sem juros`;
}

/** Texto curto do desconto de um cupom — "10% OFF" ou "R$ 20,00 OFF". */
export function formatOfferValue(offer: { type: "PERCENT" | "FIXED"; value: number }) {
  return offer.type === "PERCENT" ? `${offer.value}% OFF` : `${formatPrice(offer.value)} OFF`;
}
