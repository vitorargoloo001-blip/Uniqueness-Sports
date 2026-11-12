/**
 * Constantes puras de status (sem import de Prisma/DB) — seguro pra usar em
 * Client Components. Cada status mapeia pra uma variante de cor discreta
 * definida em app/globals.css (--status-*).
 */

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  PROCESSING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELED: "danger",
  REFUNDED: "neutral",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  CANCELED: "neutral",
  REFUNDED: "neutral",
};

/**
 * Payment.paymentMethod — vem do `payment_method_id` do Mercado Pago. A
 * lista completa é grande; aqui só o que a loja aceita (ver
 * `customization.paymentMethods` em site/components/store/CheckoutPayment.tsx).
 * O que não estiver mapeado aparece como veio.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  bolbradesco: "Boleto",
  master: "Mastercard",
  visa: "Visa",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  debvisa: "Visa Débito",
  debmaster: "Mastercard Débito",
  debelo: "Elo Débito",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nova",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
  ARCHIVED: "Arquivada",
};

export const LEAD_STATUS_VARIANT: Record<string, StatusVariant> = {
  NEW: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  ARCHIVED: "neutral",
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENT: "Percentual",
  FIXED: "Valor fixo",
};

/**
 * As três etapas do fluxo de envio (páginas em /pedidos/*), na ordem em que
 * o pedido anda. Cada etapa é um Order.status — o mesmo que o site mostra
 * pro cliente, então mover aqui já aparece lá.
 */
export const FLOW_STAGES = [
  { status: "PAID", href: "/pedidos/novos", label: "Pedidos novos" },
  { status: "PROCESSING", href: "/pedidos/em-preparo", label: "Em preparo" },
  { status: "SHIPPED", href: "/pedidos/postados", label: "Postados" },
] as const;

export type FlowStatus = (typeof FLOW_STAGES)[number]["status"];

/** Order.shippingStatus — status do envio no Melhor Envio (ver site/lib/melhor-envio.ts). */
export const SHIPPING_STATUS_LABELS: Record<string, string> = {
  sending: "Enviando pro Melhor Envio…",
  error: "Falhou ao criar o envio",
  pending: "No carrinho do Melhor Envio — falta pagar e gerar a etiqueta",
  released: "Etiqueta paga",
  generated: "Etiqueta gerada — falta postar",
  received: "Recebido na agência",
  posted: "Postado",
  delivered: "Entregue",
  undelivered: "Não entregue",
  paused: "Entrega pausada",
  suspended: "Suspenso",
  canceled: "Etiqueta cancelada",
  expired: "Etiqueta expirada",
};
