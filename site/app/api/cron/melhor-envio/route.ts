import { NextResponse } from "next/server";
import { runMelhorEnvioSync } from "@/lib/melhor-envio";

// Agendado em vercel.json (1x por dia). A Vercel manda
// "Authorization: Bearer $CRON_SECRET" quando CRON_SECRET está definido.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runMelhorEnvioSync());
  } catch (err) {
    console.error("[cron/melhor-envio] falhou:", err);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
}
