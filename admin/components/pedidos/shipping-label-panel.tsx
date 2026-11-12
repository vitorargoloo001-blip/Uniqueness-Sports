"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer, Ban, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format";
import { SHIPPING_STATUS_LABELS } from "@/lib/status";
import {
  buyLabelAction,
  cancelShipmentAction,
  getLabelUrlAction,
  syncShipmentsAction,
} from "@/lib/shipping-actions";

/** Status do Melhor Envio em que a etiqueta ainda não foi paga. */
const PRECISA_COMPRAR = ["pending", "sending", "error"];
/** A partir daqui já dá pra imprimir. */
const TEM_ETIQUETA = ["released", "generated", "received", "posted", "delivered"];

export function ShippingLabelPanel({
  orderId,
  shipmentId,
  shippingStatus,
  shippingError,
  carrier,
  trackingCode,
  trackingUrl,
  balance,
  balanceError,
}: {
  orderId: string;
  shipmentId: string | null;
  shippingStatus: string | null;
  shippingError: string | null;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  balance: number | null;
  balanceError: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const statusLabel = shippingStatus
    ? (SHIPPING_STATUS_LABELS[shippingStatus] ?? shippingStatus)
    : "Ainda não enviado ao Melhor Envio";
  const podeComprar = !!shipmentId && (!shippingStatus || PRECISA_COMPRAR.includes(shippingStatus));
  const podeImprimir = !!shipmentId && !!shippingStatus && TEM_ETIQUETA.includes(shippingStatus);
  const cancelado = shippingStatus === "canceled";

  function comprar() {
    startTransition(async () => {
      const r = await buyLabelAction(orderId);
      if (!r.success) toast.error(r.error);
      else toast.success("Etiqueta comprada e gerada");
      router.refresh();
    });
  }

  function imprimir() {
    startTransition(async () => {
      const r = await getLabelUrlAction(orderId);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      window.open(r.data, "_blank", "noopener");
    });
  }

  function cancelar() {
    startTransition(async () => {
      const r = await cancelShipmentAction(orderId, motivo);
      if (!r.success) toast.error(r.error);
      else {
        toast.success("Envio cancelado");
        setCancelando(false);
        setMotivo("");
      }
      router.refresh();
    });
  }

  function sincronizar() {
    startTransition(async () => {
      const r = await syncShipmentsAction();
      if (!r.success) toast.error(r.error);
      else toast.success(`Sincronizado: ${r.data.sent} enviado(s), ${r.data.synced} atualizado(s)`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Etiqueta (Melhor Envio)</CardTitle>
        <CardAction className="text-xs">
          {balanceError ? (
            <span className="text-destructive" title={balanceError}>
              Saldo indisponível
            </span>
          ) : (
            balance !== null && (
              <span className="text-muted-foreground">
                Saldo:{" "}
                <strong className={balance <= 0 ? "text-destructive" : "text-foreground"}>
                  {formatPrice(balance)}
                </strong>
              </span>
            )
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={statusLabel}
            variant={
              shippingStatus === "error" ? "danger"
              : shippingStatus === "delivered" ? "success"
              : cancelado ? "neutral"
              : shippingStatus ? "info"
              : "warning"
            }
          />
          {carrier && <span className="text-muted-foreground">{carrier}</span>}
        </div>

        {shippingError && (
          <p className="text-destructive">
            {shippingError}. A rotina diária tenta de novo sozinha — ou use &quot;Sincronizar agora&quot;.
          </p>
        )}

        {trackingCode && (
          <p className="text-muted-foreground">
            Rastreio:{" "}
            {trackingUrl ? (
              <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-foreground underline">
                {trackingCode}
              </a>
            ) : (
              <span className="text-foreground">{trackingCode}</span>
            )}
          </p>
        )}

        {!shipmentId ? (
          <p className="text-muted-foreground">
            O envio entra no Melhor Envio sozinho quando o pagamento é aprovado. Se o pedido já está pago e
            nada apareceu aqui, use &quot;Sincronizar agora&quot;.
          </p>
        ) : (
          balance !== null && balance <= 0 && podeComprar && (
            <p className="text-destructive">
              Sem saldo no Melhor Envio — coloque saldo na conta deles antes de comprar a etiqueta.
            </p>
          )
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {podeComprar && (
            <Button size="sm" onClick={comprar} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
              Comprar etiqueta
            </Button>
          )}
          {podeImprimir && (
            <Button size="sm" onClick={imprimir} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              Imprimir etiqueta
            </Button>
          )}
          {!!shipmentId && !cancelado && (
            <Button size="sm" variant="outline" onClick={() => setCancelando((v) => !v)} disabled={isPending}>
              <Ban className="size-4" />
              Cancelar envio
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={sincronizar} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Sincronizar agora
          </Button>
        </div>

        {cancelando && (
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
            <Input
              placeholder="Motivo do cancelamento"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="max-w-xs"
            />
            <Button size="sm" variant="destructive" onClick={cancelar} disabled={isPending || !motivo.trim()}>
              Confirmar cancelamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
