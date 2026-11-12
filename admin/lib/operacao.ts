import "server-only";
import { prisma } from "@/lib/prisma";
import { getBalance, getPaidLabelCosts } from "@/lib/melhor-envio";

/**
 * Os números que juntam pagamento e envio num lugar só. Separado de
 * `lib/dashboard.ts` de propósito: aqui tem chamada pra API do Melhor Envio,
 * que é lenta e pode cair — a página renderiza o resto sem esperar (Suspense)
 * e nada aqui derruba o dashboard.
 */

/** Dinheiro, direto do banco. Sem API externa, então é rápido. */
export async function getFinanceSummary() {
  const [pagos, estornos] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true, shippingTotal: true, discountTotal: true },
    }),
    prisma.payment.aggregate({ _sum: { refundedAmount: true } }),
  ]);

  return {
    faturamento: Number(pagos._sum.total ?? 0),
    freteCobrado: Number(pagos._sum.shippingTotal ?? 0),
    descontos: Number(pagos._sum.discountTotal ?? 0),
    estornado: Number(estornos._sum.refundedAmount ?? 0),
  };
}

export type FinanceSummary = Awaited<ReturnType<typeof getFinanceSummary>>;

/**
 * Frete cobrado × custo real da etiqueta, pedido a pedido. É onde aparece o
 * prejuízo do frete grátis: pedido acima de R$ 299 sai com frete zerado pro
 * cliente, mas a etiqueta continua custando.
 */
export async function getShippingMargin() {
  const costs = await getPaidLabelCosts();
  if (!costs.success) return { success: false as const, error: costs.error };

  const ids = Object.keys(costs.data);
  if (ids.length === 0) {
    return { success: true as const, data: { etiquetas: 0, custo: 0, cobrado: 0, margem: 0 } };
  }

  const orders = await prisma.order.findMany({
    where: { melhorEnvioId: { in: ids } },
    select: { melhorEnvioId: true, shippingTotal: true },
  });

  let custo = 0;
  let cobrado = 0;
  for (const order of orders) {
    custo += costs.data[order.melhorEnvioId!] ?? 0;
    cobrado += Number(order.shippingTotal);
  }

  return {
    success: true as const,
    data: { etiquetas: orders.length, custo, cobrado, margem: cobrado - custo },
  };
}

/** Saldo do Melhor Envio — sem ele não dá pra comprar etiqueta. */
export async function getShippingBalance() {
  const result = await getBalance();
  return result.success ? { success: true as const, balance: result.data.balance } : result;
}

const QUEUE_PREVIEW = 4;

const select = { id: true, orderNumber: true, customerName: true } as const;

/**
 * A fila de trabalho: o que está parado esperando uma ação sua. Cada grupo
 * traz os primeiros pedidos pra ir direto neles.
 */
export async function getActionQueue() {
  const base = { orderBy: { createdAt: "desc" }, take: QUEUE_PREVIEW, select } as const;

  const [semEnvio, aComprar, comErro, aPostar] = await Promise.all([
    // Pago e com frete escolhido, mas nunca entrou no Melhor Envio.
    prisma.order.findMany({
      where: { status: "PAID", melhorEnvioId: null, shippingServiceId: { not: null } },
      ...base,
    }),
    prisma.order.findMany({ where: { shippingStatus: "pending" }, ...base }),
    prisma.order.findMany({ where: { shippingStatus: "error" }, ...base }),
    prisma.order.findMany({ where: { shippingStatus: { in: ["released", "generated"] } }, ...base }),
  ]);

  const [nSemEnvio, nAComprar, nComErro, nAPostar] = await Promise.all([
    prisma.order.count({
      where: { status: "PAID", melhorEnvioId: null, shippingServiceId: { not: null } },
    }),
    prisma.order.count({ where: { shippingStatus: "pending" } }),
    prisma.order.count({ where: { shippingStatus: "error" } }),
    prisma.order.count({ where: { shippingStatus: { in: ["released", "generated"] } } }),
  ]);

  return [
    {
      key: "erro",
      label: "Falharam ao entrar no Melhor Envio",
      hint: "Use “Sincronizar agora” na tela do pedido.",
      tone: "danger" as const,
      count: nComErro,
      orders: comErro,
    },
    {
      key: "sem-envio",
      label: "Pagos, sem envio criado",
      hint: "Devem entrar sozinhos; se não entraram, sincronize.",
      tone: "warning" as const,
      count: nSemEnvio,
      orders: semEnvio,
    },
    {
      key: "comprar",
      label: "Esperando compra da etiqueta",
      hint: "Precisa de saldo no Melhor Envio.",
      tone: "warning" as const,
      count: nAComprar,
      orders: aComprar,
    },
    {
      key: "postar",
      label: "Etiqueta pronta, falta postar",
      hint: "Imprima e leve na agência.",
      tone: "info" as const,
      count: nAPostar,
      orders: aPostar,
    },
  ];
}

export type ActionQueue = Awaited<ReturnType<typeof getActionQueue>>;
