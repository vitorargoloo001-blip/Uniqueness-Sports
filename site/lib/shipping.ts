"use server";

import { prisma } from "@/lib/prisma";
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

/**
 * Estimativa de frete na página do produto, antes de ter carrinho. Preço e
 * peso vêm do banco pelo `productId` — nunca do cliente. É só estimativa: o
 * valor cobrado continua sendo o recotado no checkout.
 */
export async function getProductShippingOptionsAction(
  productId: string,
  zipCode: string,
  quantity = 1,
): Promise<ActionResult<ShippingOption[]>> {
  if (zipCode.replace(/\D/g, "").length !== 8) {
    return { success: false, error: "CEP inválido" };
  }

  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) {
    return { success: false, error: "Produto indisponível" };
  }

  const qty = Math.max(1, Math.min(Math.floor(quantity) || 1, 20));
  const unitPrice = Number(product.price);

  return getShippingOptions(
    zipCode,
    [
      {
        id: product.id,
        quantity: qty,
        unitPrice,
        weightGrams: product.weightGrams,
        unitsPerBox: product.unitsPerBox,
      },
    ],
    unitPrice * qty,
  );
}
