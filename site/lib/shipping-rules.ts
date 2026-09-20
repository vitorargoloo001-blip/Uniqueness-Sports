/**
 * Regras de frete puras (sem Prisma/fetch) — seguras pra Client Components.
 * A integração com o Melhor Envio em si fica em lib/melhor-envio.ts.
 */

/** Acima desse valor (subtotal já com cupom) a opção mais barata sai grátis. Bate com o BenefitsBar da home. */
export const FREE_SHIPPING_THRESHOLD = 299;

/** Caixa usada pra produto sem medidas cadastradas no admin. Folgada de propósito: cotar a menos vira prejuízo na etiqueta. */
export const DEFAULT_PACKAGE = { weightGrams: 1000, heightCm: 12, widthCm: 16, lengthCm: 20 };

export type ShippingOption = {
  serviceId: number;
  /** "Correios PAC", "Jadlog .Package"… — vai pro Order.carrier. */
  label: string;
  /** O que o cliente paga (0 quando grátis). */
  price: number;
  /** Preço cotado no Melhor Envio, antes do frete grátis. */
  quotedPrice: number;
  deliveryDays: number;
  free: boolean;
};

/** Ordena por preço e, se o pedido passou do mínimo, zera a opção mais barata. */
export function applyFreeShipping(options: ShippingOption[], orderValue: number): ShippingOption[] {
  const sorted = [...options].sort((a, b) => a.quotedPrice - b.quotedPrice);
  if (orderValue < FREE_SHIPPING_THRESHOLD || sorted.length === 0) return sorted;
  const [cheapest, ...rest] = sorted;
  return [{ ...cheapest, price: 0, free: true }, ...rest];
}
