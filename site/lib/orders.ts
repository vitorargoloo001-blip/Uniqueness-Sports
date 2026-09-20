import "server-only";
import { prisma } from "@/lib/prisma";
import { validateCoupon, calculateDiscount, type DiscountLine } from "@/lib/coupons";
import { getShippingOptions } from "@/lib/melhor-envio";
import type { CheckoutInput } from "@/lib/validations";

export { ORDER_STATUS_LABELS } from "@/lib/order-status";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `US${y}${m}${d}${rand}`;
}


/**
 * Cria um Order + OrderItems (com snapshot de preço/nome) a partir do
 * carrinho atual, decrementando estoque de forma atômica. Não mexe em
 * pagamento — isso é responsabilidade de lib/payment.
 */
export async function createOrderFromCart(
  cartId: string,
  userId: string | null,
  input: CheckoutInput,
): Promise<
  ActionResult<{
    orderId: string;
    orderNumber: string;
    total: number;
    shipping: { label: string; price: number };
  }>
> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } }, coupon: true },
  });

  if (!cart || cart.items.length === 0) {
    return { success: false, error: "Carrinho vazio" };
  }

  for (const item of cart.items) {
    if (!item.product.isActive) {
      return { success: false, error: `${item.product.name} não está mais disponível` };
    }
    if (item.quantity > item.product.stock) {
      return {
        success: false,
        error: `${item.product.name}: apenas ${item.product.stock} unidade(s) disponível(is)`,
      };
    }
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  // Nunca confiar num desconto vindo do carrinho sem revalidar — o cupom
  // pode ter expirado/esgotado entre o cliente aplicar e finalizar a
  // compra. Se não for mais válido, o pedido segue sem desconto (não
  // trava o checkout por causa de um cupom vencido).
  let discountTotal = 0;
  let couponId: string | null = null;
  if (cart.coupon) {
    const items: DiscountLine[] = cart.items.map((item) => ({
      productId: item.productId,
      categoryId: item.product.categoryId,
      price: Number(item.product.price),
      quantity: item.quantity,
    }));
    const revalidated = await validateCoupon(cart.coupon.code, items);
    if (revalidated.success) {
      discountTotal = calculateDiscount(revalidated.coupon, items);
      couponId = revalidated.coupon.id;
    }
  }

  // Mesmo raciocínio do cupom: o frete escolhido no checkout é recotado
  // aqui, e o preço que vale é o de agora (inclusive a regra de frete
  // grátis, que depende do subtotal já com desconto).
  const shippingQuote = await getShippingOptions(
    input.zipCode,
    cart.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.product.price),
      weightGrams: item.product.weightGrams,
      heightCm: item.product.heightCm,
      widthCm: item.product.widthCm,
      lengthCm: item.product.lengthCm,
    })),
    Math.max(0, subtotal - discountTotal),
  );
  if (!shippingQuote.success) {
    return shippingQuote;
  }
  const shipping = shippingQuote.data.find((option) => option.serviceId === input.shippingServiceId);
  if (!shipping) {
    return { success: false, error: "A opção de frete escolhida não está mais disponível. Escolha outra." };
  }
  const shippingTotal = shipping.price;

  const total = Math.max(0, subtotal + shippingTotal - discountTotal);
  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Reserva de estoque atômica: só decrementa linhas que ainda têm
      // estoque suficiente (evita overselling em corrida entre pedidos).
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`${item.product.name}: estoque insuficiente`);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerCpf: input.customerCpf,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          subtotal,
          shippingTotal,
          discountTotal,
          couponId,
          total,
          shippingZipCode: input.zipCode,
          shippingStreet: input.street,
          shippingNumber: input.number,
          shippingComplement: input.complement || null,
          shippingDistrict: input.district,
          shippingCity: input.city,
          shippingState: input.state,
          carrier: shipping.label,
          shippingServiceId: shipping.serviceId,
          shippingDeliveryDays: shipping.deliveryDays,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              sku: item.product.sku,
              imageUrl: item.product.imageUrl,
              unitPrice: item.product.price,
              quantity: item.quantity,
              total: Number(item.product.price) * item.quantity,
            })),
          },
          events: {
            create: {
              status: "PENDING_PAYMENT",
              message: "Pedido criado, aguardando pagamento.",
            },
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId } });
      await tx.cart.update({ where: { id: cartId }, data: { couponId: null } });

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      return created;
    });

    return {
      success: true,
      // Valor já arredondado pelo banco (Decimal 10,2) — é o que vai ser cobrado.
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        shipping: { label: shipping.label, price: shippingTotal },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Não foi possível criar o pedido",
    };
  }
}

/** Leitura mínima pro polling da tela de "aguardando pagamento" (Pix/boleto) — sem itens/eventos. */
export async function getOrderStatus(id: string) {
  return prisma.order.findUnique({
    where: { id },
    select: { status: true, orderNumber: true },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderByNumberAndEmail(orderNumber: string, email: string) {
  return prisma.order.findFirst({
    where: { orderNumber, customerEmail: { equals: email, mode: "insensitive" } },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Restaura estoque de um pedido — usar quando pagamento falha/é cancelado. */
export async function restoreOrderStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction(
    order.items
      .filter((item) => item.productId)
      .map((item) =>
        prisma.product.update({
          where: { id: item.productId! },
          data: { stock: { increment: item.quantity } },
        }),
      ),
  );
}

export async function addOrderEvent(orderId: string, status: string, message: string) {
  await prisma.orderEvent.create({ data: { orderId, status, message } });
}
