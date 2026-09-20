export type NormalizedPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED";

/**
 * Dados do comprador pra pré-preencher o formulário embutido (Payment
 * Brick) — nome, endereço e CPF que ele já digitou na etapa de entrega,
 * pra não pedir de novo.
 */
export type CheckoutPayer = {
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
};

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  /** Order.total no servidor — nunca o valor que o formData do Brick mandar. */
  amount: number;
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  /** `formData` devolvido pelo onSubmit do Payment Brick (cartão, Pix ou boleto), repassado quase cru pra API de pagamentos. */
  formData: Record<string, unknown>;
};

export type CreatePaymentResult =
  | {
      success: true;
      providerPaymentId: string;
      status: NormalizedPaymentStatus;
      statusDetail: string | null;
      amount: number;
      paymentMethod: string;
      /** Pix: QR code copia-e-cola + imagem em base64. Boleto: link pra ver/imprimir. Ausentes em cartão. */
      pix: { qrCode: string; qrCodeBase64: string } | null;
      ticketUrl: string | null;
      raw: unknown;
    }
  | { success: false; error: string };

export type WebhookVerifyInput = {
  headers: Headers;
  searchParams: URLSearchParams;
  rawBody: string;
};

export type WebhookEvent = {
  providerPaymentId: string;
  orderId?: string;
  status: NormalizedPaymentStatus;
  amount?: number;
  paymentMethod?: string;
  raw: unknown;
};

export interface PaymentGateway {
  readonly isConfigured: boolean;
  /** Chave pública pra inicializar o SDK no navegador (`initMercadoPago`). Null se não configurada. */
  readonly publicKey: string | null;
  /** Cria o pagamento (cartão, Pix ou boleto) a partir do formData do Payment Brick — sem redirecionar. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verifica assinatura do webhook. Lança erro se inválida. */
  verifyWebhook(input: WebhookVerifyInput): Promise<void>;
  /** A partir do payload já verificado, busca/normaliza o evento de pagamento. */
  parseWebhookEvent(input: WebhookVerifyInput): Promise<WebhookEvent | null>;
}
