"use server";

import { auth } from "@/lib/auth";
import { getCart, validateCartStock } from "@/lib/cart";
import { createOrderFromCart, getOrderStatus, restoreOrderStock } from "@/lib/orders";
import { paymentGateway, type CheckoutPayer, type NormalizedPaymentStatus } from "@/lib/payment";
import { applyPaymentEvent } from "@/lib/payment/apply-event";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** "Maria Santos Pereira" -> { firstName: "Maria", lastName: "Santos Pereira" } — a MP separa os dois campos. */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName: firstName || fullName, lastName: rest.join(" ") };
}

export type CreatedOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  payer: CheckoutPayer;
};

/**
 * Cria o pedido a partir do formulário de identificação/entrega/frete.
 * Não cobra nada ainda — o pagamento (cartão, Pix ou boleto) acontece na
 * etapa seguinte, embutido na própria página (ver components/store/CheckoutPayment.tsx).
 */
export async function createOrderAction(input: CheckoutInput): Promise<ActionResult<CreatedOrder>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const stockCheck = await validateCartStock();
  if (!stockCheck.success) {
    return stockCheck;
  }

  const session = await auth();
  const cart = await getCart();
  if (!cart.id) {
    return { success: false, error: "Carrinho vazio" };
  }

  const orderResult = await createOrderFromCart(cart.id, session?.user?.id ?? null, parsed.data);
  if (!orderResult.success) {
    return orderResult;
  }

  if (session?.user?.id && parsed.data.saveAddress) {
    const existingCount = await prisma.address.count({ where: { userId: session.user.id } });
    await prisma.address.create({
      data: {
        userId: session.user.id,
        recipient: parsed.data.customerName,
        phone: parsed.data.customerPhone,
        zipCode: parsed.data.zipCode,
        street: parsed.data.street,
        number: parsed.data.number,
        complement: parsed.data.complement || null,
        district: parsed.data.district,
        city: parsed.data.city,
        state: parsed.data.state,
        isDefault: existingCount === 0,
      },
    });
  }

  const { firstName, lastName } = splitName(parsed.data.customerName);

  return {
    success: true,
    data: {
      orderId: orderResult.data.orderId,
      orderNumber: orderResult.data.orderNumber,
      total: orderResult.data.total,
      payer: {
        email: parsed.data.customerEmail,
        firstName,
        lastName,
        cpf: parsed.data.customerCpf,
        address: {
          zipCode: parsed.data.zipCode,
          street: parsed.data.street,
          number: parsed.data.number,
          complement: parsed.data.complement || undefined,
          district: parsed.data.district,
          city: parsed.data.city,
          state: parsed.data.state,
        },
      },
    },
  };
}

/**
 * Cobra o pedido já criado — chamada pelo onSubmit do Payment Brick com o
 * formData de cartão, Pix ou boleto. Nunca redireciona: o resultado (pago,
 * aguardando Pix/boleto, ou recusado) é tratado inline pelo componente,
 * que continua na página.
 */
export async function payOrderAction(
  orderId: string,
  formData: Record<string, unknown>,
): Promise<
  ActionResult<{
    status: NormalizedPaymentStatus;
    statusDetail: string | null;
    pix: { qrCode: string; qrCodeBase64: string } | null;
    ticketUrl: string | null;
  }>
> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: "Pedido não encontrado" };
  }
  if (order.status !== "PENDING_PAYMENT") {
    return { success: false, error: "Esse pedido já foi processado." };
  }

  const { firstName, lastName } = splitName(order.customerName);
  const result = await paymentGateway.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    payerEmail: order.customerEmail,
    payerFirstName: firstName,
    payerLastName: lastName,
    formData,
  });
  if (!result.success) {
    return result;
  }

  // Aplica na hora, sem esperar o webhook — que ainda vai chegar e
  // reprocessar o mesmo evento de forma segura (upsert idempotente).
  await applyPaymentEvent({
    providerPaymentId: result.providerPaymentId,
    orderId: order.id,
    status: result.status,
    amount: result.amount,
    paymentMethod: result.paymentMethod,
    raw: result.raw,
  });

  return {
    success: true,
    data: {
      status: result.status,
      statusDetail: result.statusDetail,
      pix: result.pix,
      ticketUrl: result.ticketUrl,
    },
  };
}

/** Status atual do pedido — usado pela tela de "aguardando pagamento" (Pix/boleto) pra saber quando redirecionar. */
export async function getOrderStatusAction(orderId: string) {
  return getOrderStatus(orderId);
}

/** Cancela um pedido pendente (ex: usuário desiste na página de erro) e devolve estoque. */
export async function cancelPendingOrder(orderNumber: string): Promise<ActionResult> {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.status !== "PENDING_PAYMENT") {
    return { success: false, error: "Pedido não encontrado ou já processado" };
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELED" } });
  await restoreOrderStock(order.id);
  return { success: true, data: undefined };
}
