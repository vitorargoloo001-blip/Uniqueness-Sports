import "server-only";
import { prisma } from "@/lib/prisma";

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      coupon: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Status em que o estoque do pedido já voltou pra prateleira. Entrar de novo
 * em um deles não devolve nada — ver `restoreOrderStockOnce`.
 */
const STOCK_RESTORED_STATUSES = new Set(["CANCELED", "REFUNDED"]);

/**
 * Devolve o estoque só na *transição* pra cancelado/estornado. Sem essa
 * checagem o estoque volta duas vezes quando a mesma mudança acontece por
 * dois caminhos — por exemplo um estorno feito aqui e, minutos depois, o
 * webhook do Mercado Pago avisando do mesmo estorno lá no site.
 */
export async function restoreOrderStockOnce(previousStatus: string, nextStatus: string, orderId: string) {
  if (!STOCK_RESTORED_STATUSES.has(nextStatus)) return;
  if (STOCK_RESTORED_STATUSES.has(previousStatus)) return;
  await restoreOrderStock(orderId);
}

export async function restoreOrderStock(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
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
