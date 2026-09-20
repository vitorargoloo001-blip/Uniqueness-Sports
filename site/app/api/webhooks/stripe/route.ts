import { NextResponse } from "next/server";

// Gateway Stripe não está ativo neste projeto — ver lib/payment/stripe.ts.
export async function POST() {
  return NextResponse.json(
    { error: "Stripe não está configurado neste projeto" },
    { status: 501 },
  );
}
