"use server";

import { getCart } from "@/lib/cart";
import { getShippingOptions } from "@/lib/melhor-envio";
import type { ShippingOption } from "@/lib/shipping-rules";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Cotação pro checkout — sempre a partir do carrinho no servidor, nunca de itens vindos do cliente. */
export async function getShippingOptionsAction(zipCode: string): Promise<ActionResult<ShippingOption[]>> {
  if (zipCode.replace(/\D/g, "").length !== 8) {
    return { success: false, error: "CEP inválido" };
  }

  const cart = await getCart();
  if (cart.items.length === 0) {
    return { success: false, error: "Carrinho vazio" };
  }

  return getShippingOptions(
    zipCode,
    cart.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
      weightGrams: item.product.weightGrams,
      unitsPerBox: item.product.unitsPerBox,
    })),
    cart.total,
  );
}
