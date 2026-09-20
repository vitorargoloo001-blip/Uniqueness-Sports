/**
 * Constante pura (sem import de Prisma/DB) — seguro pra usar em Client
 * Components. Lógica de pedidos que toca o banco fica em lib/orders.ts.
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  PROCESSING: "Em separação",
  SHIPPED: "Pedido enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};
