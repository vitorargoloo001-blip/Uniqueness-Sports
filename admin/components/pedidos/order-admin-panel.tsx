"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatusAction, setTrackingAction } from "@/lib/orders-actions";
import { ORDER_STATUS_LABELS } from "@/lib/status";
import type { OrderStatus } from "@/lib/generated/prisma/client";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function OrderAdminPanel({
  orderId,
  currentStatus,
  carrier,
  trackingCode,
  trackingUrl,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [carrierInput, setCarrierInput] = useState(carrier ?? "");
  const [codeInput, setCodeInput] = useState(trackingCode ?? "");
  const [urlInput, setUrlInput] = useState(trackingUrl ?? "");
  const [isPending, startTransition] = useTransition();

  function saveStatus() {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status);
      if (!result.success) toast.error(result.error);
      else toast.success("Status atualizado");
      router.refresh();
    });
  }

  function saveTracking() {
    if (!codeInput.trim()) {
      toast.error("Informe o código de rastreio");
      return;
    }
    startTransition(async () => {
      const result = await setTrackingAction(orderId, carrierInput, codeInput, urlInput);
      if (!result.success) toast.error(result.error);
      else toast.success("Rastreio salvo");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={saveStatus} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Atualizar status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Rastreamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field>
            <FieldLabel htmlFor="carrier">Transportadora</FieldLabel>
            <Input id="carrier" value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="trackingCode">Código de rastreio</FieldLabel>
            <Input id="trackingCode" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="trackingUrl">Link de rastreio (opcional)</FieldLabel>
            <Input id="trackingUrl" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
          </Field>
          <Button onClick={saveTracking} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar rastreio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
