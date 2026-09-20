import { mercadoPagoGateway } from "@/lib/payment/mercadopago";
import { stripeGateway } from "@/lib/payment/stripe";
import type { PaymentGateway } from "@/lib/payment/types";

export * from "@/lib/payment/types";

/** Gateway ativo do projeto. Mercado Pago é o priorizado (ver lib/payment/stripe.ts pra trocar). */
export const paymentGateway: PaymentGateway = mercadoPagoGateway;

export const gateways = { mercadopago: mercadoPagoGateway, stripe: stripeGateway };
