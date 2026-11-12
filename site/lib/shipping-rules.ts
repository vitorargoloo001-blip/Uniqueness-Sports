/**
 * Regras de frete puras (sem Prisma/fetch) — seguras pra Client Components.
 * A integração com o Melhor Envio em si fica em lib/melhor-envio.ts.
 */

/** Acima desse valor (subtotal já com cupom) a opção mais barata sai grátis. Bate com o BenefitsBar da home. */
export const FREE_SHIPPING_THRESHOLD = 299;

/**
 * Caixa padrão da operação — todo pedido sai nela. `tareGrams` é o peso da
 * caixa vazia, somado uma única vez por envio (não por item).
 */
export const SHIPPING_BOX = { heightCm: 12, widthCm: 9.5, lengthCm: 18.5, tareGrams: 80 };

/** Peso por unidade assumido pra produto sem peso cadastrado no admin. Folgado de propósito: cotar a menos vira prejuízo na etiqueta. */
export const FALLBACK_PRODUCT_WEIGHT_GRAMS = 500;

/** Quantas unidades cabem na caixa quando o produto não tem isso cadastrado. Conservador: cotar caixa a menos vira prejuízo. */
export const FALLBACK_UNITS_PER_BOX = 4;

export type PackableItem = {
  quantity: number;
  weightGrams: number | null;
  unitsPerBox: number | null;
};

/**
 * Quantas caixas o pedido ocupa. Cada produto ocupa `1 / unitsPerBox` de
 * caixa por unidade, então itens diferentes dividem a mesma caixa até
 * lotá-la. Ex.: com 4 creatinas e 12 termogênicos por caixa, 2 creatinas +
 * 6 termogênicos = 0,5 + 0,5 = 1 caixa; 6 creatinas = 1,5 -> 2 caixas.
 */
export function shipmentBoxCount(items: PackableItem[]): number {
  const ocupacao = items.reduce(
    (total, item) => total + item.quantity / (item.unitsPerBox ?? FALLBACK_UNITS_PER_BOX),
    0,
  );
  return Math.max(1, Math.ceil(ocupacao));
}

/**
 * Peso total do envio em kg: soma do peso dos produtos mais a tara de cada
 * caixa usada. Ex.: 1 creatina (300 g) numa caixa = 380 g; 2 = 680 g.
 */
export function shipmentWeightKg(items: PackableItem[]): number {
  const produtos = items.reduce(
    (total, item) => total + (item.weightGrams ?? FALLBACK_PRODUCT_WEIGHT_GRAMS) * item.quantity,
    0,
  );
  return (produtos + SHIPPING_BOX.tareGrams * shipmentBoxCount(items)) / 1000;
}

/**
 * Os volumes que vão pro Melhor Envio: uma entrada por caixa, com o peso
 * dos produtos distribuído entre elas e a tara somada em cada uma.
 */
export function shipmentVolumes(items: PackableItem[]) {
  const caixas = shipmentBoxCount(items);
  const produtosKg = items.reduce(
    (total, item) => total + (item.weightGrams ?? FALLBACK_PRODUCT_WEIGHT_GRAMS) * item.quantity,
    0,
  ) / 1000;

  return Array.from({ length: caixas }, () => ({
    height: SHIPPING_BOX.heightCm,
    width: SHIPPING_BOX.widthCm,
    length: SHIPPING_BOX.lengthCm,
    weight: Number((produtosKg / caixas + SHIPPING_BOX.tareGrams / 1000).toFixed(3)),
  }));
}

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
