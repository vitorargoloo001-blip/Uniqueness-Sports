import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyShipmentUpdate, verifyMelhorEnvioSignature } from "@/lib/melhor-envio";

type MelhorEnvioWebhook = {
  event?: string;
  data?: { id?: string; status?: string; tracking?: string | null; self_tracking?: string | null };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyMelhorEnvioSignature(rawBody, request.headers.get("x-me-signature"))) {
    console.error("[webhook/melhor-envio] assinatura inválida");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: MelhorEnvioWebhook;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { id, status } = payload.data ?? {};
  if (!id || !status) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { melhorEnvioId: id } });
  if (!order) {
    // Etiqueta criada direto no painel do Melhor Envio, fora do site — ack e sai.
    return NextResponse.json({ received: true });
  }

  // Payload já autenticado pela assinatura, então dá pra aplicar direto.
  await applyShipmentUpdate(order, {
    status,
    tracking: payload.data?.tracking ?? payload.data?.self_tracking ?? null,
  });

  return NextResponse.json({ received: true });
}
