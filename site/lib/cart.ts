"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateCoupon, calculateDiscount, type DiscountLine } from "@/lib/coupons";

const CART_COOKIE = "cart_session_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomUUID();
  store.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return sessionId;
}

async function getOrCreateCartId(): Promise<string> {
  const session = await auth();

  if (session?.user?.id) {
    const existing = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing.id;
    const created = await prisma.cart.create({
      data: { userId: session.user.id },
    });
    return created.id;
  }

  const sessionId = await getOrCreateSessionId();
  const existing = await prisma.cart.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.id;
  const created = await prisma.cart.create({ data: { sessionId } });
  return created.id;
}

export type CartWithTotals = Awaited<ReturnType<typeof getCart>>;

async function findCartRecord() {
  const session = await auth();
  const store = await cookies();
  const sessionId = store.get(CART_COOKIE)?.value;

  const include = {
    items: { include: { product: true }, orderBy: { createdAt: "asc" as const } },
    coupon: true,
  };

  return session?.user?.id
    ? prisma.cart.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, include })
    : sessionId
      ? prisma.cart.findFirst({ where: { sessionId }, orderBy: { createdAt: "asc" }, include })
      : null;
}

/**
 * Carrinho atual (do usuário logado, ou anônimo via cookie de sessão) —
 * já com o cupom aplicado revalidado contra o conteúdo atual (se o cupom
 * expirou ou deixou de valer enquanto o carrinho ficou parado, ele é
 * removido aqui e `couponError` avisa o motivo pra UI mostrar).
 */
export async function getCart() {
  const cart = await findCartRecord();
  const rawItems = cart?.items ?? [];

  // Decimal (Prisma) não é serializável na fronteira Server -> Client
  // Component — converter pra number aqui antes de devolver.
  const items = rawItems.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
      compareAtPrice: item.product.compareAtPrice
        ? Number(item.product.compareAtPrice)
        : null,
    },
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const discountLines: DiscountLine[] = items.map((item) => ({
    productId: item.productId,
    categoryId: item.product.categoryId,
    price: item.product.price,
    quantity: item.quantity,
  }));

  let coupon: { code: string; type: "PERCENT" | "FIXED"; value: number } | null = null;
  let discountTotal = 0;
  let couponError: string | null = null;

  if (cart?.coupon) {
    const revalidated = await validateCoupon(cart.coupon.code, discountLines);
    if (revalidated.success) {
      coupon = { code: revalidated.coupon.code, type: revalidated.coupon.type, value: Number(revalidated.coupon.value) };
      discountTotal = calculateDiscount(revalidated.coupon, discountLines);
    } else {
      couponError = `Cupom "${cart.coupon.code}" removido: ${revalidated.error.toLowerCase()}.`;
      await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }
  }

  return {
    id: cart?.id ?? null,
    items,
    subtotal,
    itemCount,
    coupon,
    discountTotal,
    total: Math.max(0, subtotal - discountTotal),
    couponError,
  };
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  if (quantity < 1) {
    return { success: false, error: "Quantidade inválida" };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return { success: false, error: "Produto indisponível" };
  }

  const cartId = await getOrCreateCartId();
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

  const desiredQty = (existingItem?.quantity ?? 0) + quantity;
  if (desiredQty > product.stock) {
    return {
      success: false,
      error:
        product.stock === 0
          ? "Produto fora de estoque"
          : `Apenas ${product.stock} unidade(s) disponível(is)`,
    };
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: desiredQty },
    create: { cartId, productId, quantity },
  });

  revalidatePath("/carrinho");
  revalidatePath("/produtos", "layout");
  return { success: true, data: undefined };
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<ActionResult> {
  if (quantity < 1) {
    return removeCartItem(itemId);
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });
  if (!item) return { success: false, error: "Item não encontrado" };

  if (quantity > item.product.stock) {
    return {
      success: false,
      error: `Apenas ${item.product.stock} unidade(s) disponível(is)`,
    };
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  revalidatePath("/carrinho");
  return { success: true, data: undefined };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  revalidatePath("/carrinho");
  return { success: true, data: undefined };
}

/**
 * Funde o carrinho anônimo (por cookie de sessão) no carrinho do usuário
 * recém-logado, somando quantidades de produtos repetidos, respeitando
 * estoque. Chamar logo após login/cadastro bem-sucedido.
 */
export async function mergeCartOnLogin(userId: string): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(CART_COOKIE)?.value;
  if (!sessionId) return;

  const guestCart = await prisma.cart.findFirst({
    where: { sessionId },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await prisma.cart.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const targetCartId =
    userCart?.id ??
    (await prisma.cart.create({ data: { userId } })).id;

  for (const guestItem of guestCart.items) {
    const product = await prisma.product.findUnique({
      where: { id: guestItem.productId },
    });
    if (!product) continue;

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: targetCartId, productId: guestItem.productId },
      },
    });

    const desiredQty = Math.min(
      (existing?.quantity ?? 0) + guestItem.quantity,
      product.stock,
    );
    if (desiredQty < 1) continue;

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: targetCartId, productId: guestItem.productId },
      },
      update: { quantity: desiredQty },
      create: { cartId: targetCartId, productId: guestItem.productId, quantity: desiredQty },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  store.delete(CART_COOKIE);
}

/** Valida estoque de todos os itens do carrinho — usar antes do checkout. */
export async function validateCartStock(): Promise<ActionResult> {
  const { items } = await getCart();
  if (items.length === 0) {
    return { success: false, error: "Carrinho vazio" };
  }

  for (const item of items) {
    if (!item.product.isActive) {
      return {
        success: false,
        error: `${item.product.name} não está mais disponível`,
      };
    }
    if (item.quantity > item.product.stock) {
      return {
        success: false,
        error: `${item.product.name}: apenas ${item.product.stock} unidade(s) disponível(is)`,
      };
    }
  }

  return { success: true, data: undefined };
}

export async function applyCouponAction(code: string): Promise<ActionResult<{ discount: number }>> {
  const cart = await findCartRecord();
  if (!cart || cart.items.length === 0) {
    return { success: false, error: "Adicione produtos ao carrinho antes de aplicar um cupom" };
  }

  const items: DiscountLine[] = cart.items.map((item) => ({
    productId: item.productId,
    categoryId: item.product.categoryId,
    price: Number(item.product.price),
    quantity: item.quantity,
  }));

  const result = await validateCoupon(code, items);
  if (!result.success) return result;

  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: result.coupon.id } });
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { success: true, data: { discount: calculateDiscount(result.coupon, items) } };
}

export async function removeCouponAction(): Promise<ActionResult> {
  const cart = await findCartRecord();
  if (cart?.couponId) {
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  }
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { success: true, data: undefined };
}
