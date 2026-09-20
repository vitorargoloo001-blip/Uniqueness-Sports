import type { PaymentGateway } from "@/lib/payment/types";

/**
 * Gateway alternativo, desativado por padrão (Mercado Pago é o gateway
 * priorizado — ver lib/payment/mercadopago.ts). Pra ativar:
 *   1. npm install stripe
 *   2. Implementar createPayment/verifyWebhook/parseWebhookEvent aqui
 *      usando a lib `stripe` (Payment Element + `stripe.webhooks.constructEvent`)
 *   3. Trocar o gateway ativo em lib/payment/index.ts
 */
export const stripeGateway: PaymentGateway = {
  isConfigured: false,
  publicKey: null,

  async createPayment() {
    return {
      success: false,
      error: "Gateway Stripe não está implementado nesse projeto ainda.",
    };
  },

  async verifyWebhook() {
    throw new Error("Gateway Stripe não está implementado nesse projeto ainda.");
  },

  async parseWebhookEvent() {
    return null;
  },
};
