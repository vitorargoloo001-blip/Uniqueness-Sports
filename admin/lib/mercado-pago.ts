import "server-only";

import { randomUUID } from "crypto";
import { MercadoPagoConfig, Payment as MpPayment, PaymentRefund } from "mercadopago";

/**
 * Operações de pagamento do Mercado Pago usadas só pelo admin — estornar,
 * cancelar e reler o status de um pagamento já criado. Quem *cria* pagamento
 * é o site (`site/lib/payment/mercadopago.ts`, via Payment Brick); aqui só
 * mexemos no que já existe.
 *
 * Saldo da conta **não** entra aqui: o endpoint de saldo
 * (`/users/{id}/mercadopago_account/balance`) responde 403 pro access token
 * de aplicação — ele exige um token OAuth do titular. Saldo continua sendo
 * visto no painel do próprio Mercado Pago.
 */

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export const isMercadoPagoConfigured = Boolean(ACCESS_TOKEN);

export type Result<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Mesmo mapa de `site/lib/payment/mercadopago.ts` — os dois projetos não compartilham código. */
export type NormalizedStatus = "PAID" | "PENDING" | "FAILED" | "CANCELED" | "REFUNDED";

function normalizeStatus(mpStatus: string | undefined): NormalizedStatus {
  switch (mpStatus) {
    case "approved":
      return "PAID";
    case "pending":
    case "in_process":
    case "authorized":
      return "PENDING";
    case "rejected":
      return "FAILED";
    case "cancelled":
      return "CANCELED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

function getClient() {
  if (!ACCESS_TOKEN) return null;
  return new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Mercado Pago não respondeu";
}

export type MercadoPagoPayment = {
  status: NormalizedStatus;
  statusDetail: string | null;
  /** Valor cobrado. */
  amount: number;
  /** Quanto desse valor já foi estornado (parcial ou total). */
  refunded: number;
  paymentMethod: string | null;
  raw: unknown;
};

/** Lê o pagamento direto do Mercado Pago — fonte da verdade quando um webhook se perde. */
export async function getPayment(providerPaymentId: string): Promise<Result<MercadoPagoPayment>> {
  const client = getClient();
  if (!client) return { success: false, error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no painel" };

  try {
    const details = await new MpPayment(client).get({ id: providerPaymentId });
    return {
      success: true,
      data: {
        status: normalizeStatus(details.status),
        statusDetail: details.status_detail ?? null,
        amount: details.transaction_amount ?? 0,
        refunded: details.transaction_amount_refunded ?? 0,
        paymentMethod: details.payment_method_id ?? null,
        raw: details,
      },
    };
  } catch (err) {
    return { success: false, error: describeError(err) };
  }
}

/**
 * Estorna o pagamento. Sem `amount`, devolve tudo; com `amount`, devolve só
 * uma parte (frete cobrado a mais, item em falta etc.).
 *
 * Relê o pagamento antes pra checar quanto já foi estornado — o Mercado Pago
 * aceita vários estornos parciais no mesmo pagamento, e sem essa conta dava
 * pra devolver mais do que o cliente pagou.
 */
export async function refundPayment(
  providerPaymentId: string,
  amount?: number,
): Promise<Result<{ amount: number; isTotal: boolean }>> {
  const client = getClient();
  if (!client) return { success: false, error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no painel" };

  const current = await getPayment(providerPaymentId);
  if (!current.success) return current;

  const remaining = round2(current.data.amount - current.data.refunded);
  if (remaining <= 0) {
    return { success: false, error: "Esse pagamento já foi estornado por completo." };
  }
  if (amount !== undefined && amount > remaining) {
    return {
      success: false,
      error: `Só restam R$ ${remaining.toFixed(2)} pra estornar nesse pagamento.`,
    };
  }

  const value = amount === undefined ? remaining : round2(amount);
  const isTotal = value >= remaining;

  try {
    const refund = new PaymentRefund(client);
    // Chave de idempotência nova por tentativa: a proteção contra estorno
    // duplicado é a conta de `remaining` acima, não a chave — dois estornos
    // parciais do mesmo valor são legítimos e não podem ser deduplicados.
    const requestOptions = { idempotencyKey: randomUUID() };

    if (isTotal) await refund.total({ payment_id: providerPaymentId, requestOptions });
    else await refund.create({ payment_id: providerPaymentId, body: { amount: value }, requestOptions });

    return { success: true, data: { amount: value, isTotal } };
  } catch (err) {
    return { success: false, error: describeError(err) };
  }
}

/**
 * Cancela um pagamento que ainda não foi pago (Pix ou boleto esperando
 * pagamento). Pagamento aprovado não cancela — esse se estorna.
 */
export async function cancelPayment(providerPaymentId: string): Promise<Result> {
  const client = getClient();
  if (!client) return { success: false, error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no painel" };

  try {
    await new MpPayment(client).cancel({ id: providerPaymentId });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: describeError(err) };
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
