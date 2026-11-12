"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { addOrderEvent } from "@/lib/orders";
import { buyLabel, cancelShipment, getLabelUrl, getBalance } from "@/lib/melhor-envio";
import { moveToProcessing } from "@/lib/fluxo";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** O envio já tem que existir no Melhor Envio — quem cria é o site, quando o pagamento aprova. */
async function requireShipment(orderId: string) {
  await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, melhorEnvioId: true, orderNumber: true },
  });
  if (!order?.melhorEnvioId) {
    throw new Error("Esse pedido ainda não tem envio criado no Melhor Envio.");
  }
  return { ...order, melhorEnvioId: order.melhorEnvioId };
}

/** Paga a etiqueta com o saldo da conta e gera — depois é só imprimir. */
export async function buyLabelAction(orderId: string): Promise<ActionResult> {
  try {
    const order = await requireShipment(orderId);
    const result = await buyLabel(order.melhorEnvioId);
    if (!result.success) return result;

    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: "generated", shippingError: null },
    });
    await addOrderEvent(orderId, "PROCESSING", "Etiqueta comprada e gerada.");
    // Mesmo efeito do "Comprar etiqueta e iniciar preparo" da página Pedidos novos.
    await moveToProcessing(orderId);

    revalidatePath(`/pedidos/${orderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao comprar etiqueta" };
  }
}

/** Link público do PDF da etiqueta, pra abrir e imprimir. */
export async function getLabelUrlAction(orderId: string): Promise<ActionResult<string>> {
  try {
    const order = await requireShipment(orderId);
    return await getLabelUrl([order.melhorEnvioId]);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao abrir etiqueta" };
  }
}

/** Cancela o envio no Melhor Envio. Não mexe no status do pedido — quem decide isso é você. */
export async function cancelShipmentAction(orderId: string, motivo: string): Promise<ActionResult> {
  try {
    const order = await requireShipment(orderId);
    if (!motivo.trim()) return { success: false, error: "Diga o motivo do cancelamento" };

    const result = await cancelShipment(order.melhorEnvioId, motivo.trim());
    if (!result.success) return result;

    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: "canceled" },
    });
    await addOrderEvent(orderId, "PROCESSING", `Envio cancelado no Melhor Envio: ${motivo.trim()}`);

    revalidatePath(`/pedidos/${orderId}`);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao cancelar envio" };
  }
}

/**
 * Manda o site reprocessar os envios: reenvia pedidos pagos que falharam ao
 * entrar no Melhor Envio e atualiza rastreio/status dos que estão em
 * andamento. É a mesma rotina do cron diário, disparada na hora — assim não
 * duplicamos aqui a lógica de inserção no carrinho, que vive no site.
 */
export async function syncShipmentsAction(): Promise<ActionResult<{ sent: number; synced: number }>> {
  await requireAdmin();

  const siteUrl = process.env.SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!siteUrl || !secret) {
    return { success: false, error: "Configure SITE_URL e CRON_SECRET no painel pra usar a sincronização." };
  }

  try {
    const res = await fetch(`${siteUrl}/api/cron/melhor-envio`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return { success: false, error: `O site respondeu ${res.status} ao sincronizar.` };

    const data = (await res.json()) as { sent?: number; synced?: number };
    revalidatePath("/pedidos");
    return { success: true, data: { sent: data.sent ?? 0, synced: data.synced ?? 0 } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Falha ao sincronizar" };
  }
}

/** Saldo da carteira do Melhor Envio, pra saber se dá pra comprar etiqueta. */
export async function getShippingBalanceAction() {
  await requireAdmin();
  return getBalance();
}
