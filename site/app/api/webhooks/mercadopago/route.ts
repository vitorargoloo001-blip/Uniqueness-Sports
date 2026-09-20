import { NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payment";
import { applyPaymentEvent } from "@/lib/payment/apply-event";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const { headers } = request;
  const searchParams = new URL(request.url).searchParams;
  const input = { headers, searchParams, rawBody };

  try {
    await paymentGateway.verifyWebhook(input);
  } catch (err) {
    console.error("[webhook/mercadopago] assinatura inválida:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = await paymentGateway.parseWebhookEvent(input);
  } catch (err) {
    console.error("[webhook/mercadopago] erro ao processar evento:", err);
    return NextResponse.json({ error: "processing error" }, { status: 500 });
  }

  if (!event || !event.orderId) {
    // Notificação de um tipo/recurso que não interessa (ex: merchant_order) — ack e sai.
    return NextResponse.json({ received: true });
  }

  // Mesma lógica usada pela resposta síncrona do Payment Brick
  // (lib/checkout.ts) — upsert idempotente, então processar de novo aqui
  // (o caso comum: o Brick já aplicou e esse webhook chega logo depois) é seguro.
  await applyPaymentEvent({ ...event, orderId: event.orderId });

  return NextResponse.json({ received: true });
}
