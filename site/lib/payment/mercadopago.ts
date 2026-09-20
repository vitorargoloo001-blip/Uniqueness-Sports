import { randomUUID } from "crypto";
import {
  MercadoPagoConfig,
  Payment as MpPayment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import type { PaymentCreateRequest } from "mercadopago/dist/clients/payment/create/types";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  NormalizedPaymentStatus,
  PaymentGateway,
  WebhookEvent,
  WebhookVerifyInput,
} from "@/lib/payment/types";

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getClient() {
  if (!ACCESS_TOKEN) return null;
  return new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
}

function normalizeStatus(mpStatus: string | undefined): NormalizedPaymentStatus {
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

export const mercadoPagoGateway: PaymentGateway = {
  isConfigured: Boolean(ACCESS_TOKEN),
  publicKey: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || null,

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const client = getClient();
    if (!client) {
      return {
        success: false,
        error:
          "Pagamento não configurado: defina MERCADO_PAGO_ACCESS_TOKEN nas variáveis de ambiente.",
      };
    }

    // formData vem quase pronto do Payment Brick (cartão já tokenizado, ou
    // dados de Pix/boleto) — só sobrescrevemos o que não pode vir do
    // cliente: valor (nunca confiar no que o navegador mandar) e os
    // metadados do pedido. Pro cartão, o Brick não inclui nome/sobrenome
    // no payer (só email + documento) — completa com o nome do pedido
    // (checklist de qualidade da MP marca isso como item obrigatório pra
    // aprovação; nunca sobrescreve o que o Brick já mandou).
    const formData = input.formData as PaymentCreateRequest;
    const body: PaymentCreateRequest = {
      ...formData,
      transaction_amount: input.amount,
      external_reference: input.orderId,
      description: `Pedido ${input.orderNumber} — Uniqueness Sports`,
      notification_url: `${SITE_URL}/api/webhooks/mercadopago?source_news=webhooks`,
      payer: {
        ...formData.payer,
        first_name: formData.payer?.first_name ?? input.payerFirstName,
        last_name: formData.payer?.last_name ?? input.payerLastName,
      },
    };

    try {
      const payment = new MpPayment(client);
      // X-Idempotency-Key: exigido pela API pra Pix/boleto não duplicarem
      // em caso de retry de rede — um valor novo por tentativa de envio.
      const result = await payment.create({ body, requestOptions: { idempotencyKey: randomUUID() } });

      if (!result.id) {
        return { success: false, error: "Mercado Pago não retornou o pagamento" };
      }

      const transactionData = result.point_of_interaction?.transaction_data;
      return {
        success: true,
        providerPaymentId: String(result.id),
        status: normalizeStatus(result.status),
        statusDetail: result.status_detail ?? null,
        amount: result.transaction_amount ?? input.amount,
        paymentMethod: result.payment_method_id ?? "",
        pix:
          transactionData?.qr_code && transactionData?.qr_code_base64
            ? { qrCode: transactionData.qr_code, qrCodeBase64: transactionData.qr_code_base64 }
            : null,
        ticketUrl: transactionData?.ticket_url ?? null,
        raw: result,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Falha ao processar pagamento",
      };
    }
  },

  async verifyWebhook({ headers, searchParams }: WebhookVerifyInput): Promise<void> {
    if (!WEBHOOK_SECRET) {
      throw new Error(
        "MERCADO_PAGO_WEBHOOK_SECRET não configurado — não é possível verificar o webhook.",
      );
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: headers.get("x-signature"),
        xRequestId: headers.get("x-request-id"),
        dataId: searchParams.get("data.id"),
        secret: WEBHOOK_SECRET,
        toleranceSeconds: 300,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        throw new Error(`Assinatura de webhook inválida: ${err.reason}`);
      }
      throw err;
    }
  },

  async parseWebhookEvent({ searchParams }: WebhookVerifyInput): Promise<WebhookEvent | null> {
    const client = getClient();
    if (!client) return null;

    const type = searchParams.get("type") ?? searchParams.get("topic");
    const dataId = searchParams.get("data.id") ?? searchParams.get("id");
    if (type !== "payment" || !dataId) return null;

    const payment = new MpPayment(client);
    const details = await payment.get({ id: dataId });

    if (!details.id || !details.external_reference) return null;

    return {
      providerPaymentId: String(details.id),
      orderId: details.external_reference,
      status: normalizeStatus(details.status),
      amount: details.transaction_amount,
      paymentMethod: details.payment_method_id,
      raw: details,
    };
  },
};
