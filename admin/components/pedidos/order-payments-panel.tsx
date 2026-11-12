"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, RotateCcw, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VARIANT } from "@/lib/status";
import { cancelPaymentAction, refundPaymentAction, syncPaymentAction } from "@/lib/payments-actions";

export type AdminPayment = {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  status: string;
  amount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
};

export function OrderPaymentsPanel({ payments }: { payments: AdminPayment[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refunding, setRefunding] = useState<AdminPayment | null>(null);
  const [amountInput, setAmountInput] = useState("");

  function run(action: () => Promise<{ success: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      const r = await action();
      if (!r.success) toast.error(r.error ?? "Falhou");
      else toast.success(okMessage);
      router.refresh();
    });
  }

  function confirmRefund() {
    if (!refunding) return;
    const raw = amountInput.trim().replace(",", ".");
    const amount = raw === "" ? undefined : Number(raw);
    if (amount !== undefined && !(amount > 0)) {
      toast.error("Informe um valor maior que zero, ou deixe em branco pra estornar tudo.");
      return;
    }

    startTransition(async () => {
      const r = await refundPaymentAction(refunding.id, amount);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(
        r.data.isTotal
          ? `Estorno total de ${formatPrice(r.data.amount)} feito`
          : `Estorno parcial de ${formatPrice(r.data.amount)} feito`,
      );
      setRefunding(null);
      setAmountInput("");
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de pagamento ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((payment) => {
                const isMercadoPago = payment.provider === "MERCADO_PAGO" && !!payment.providerPaymentId;
                return (
                  <li key={payment.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 text-sm">
                    <StatusBadge
                      label={PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                      variant={PAYMENT_STATUS_VARIANT[payment.status] ?? "neutral"}
                    />
                    <span className="text-foreground">
                      {payment.paymentMethod
                        ? (PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod)
                        : "Método não informado"}
                    </span>
                    <span className="font-medium text-foreground">{formatPrice(payment.amount)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                      {payment.providerPaymentId ? ` · MP ${payment.providerPaymentId}` : ""}
                    </span>

                    {isMercadoPago && (
                      <div className="ml-auto flex flex-wrap gap-2">
                        {payment.status === "PAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                              setRefunding(payment);
                              setAmountInput("");
                            }}
                          >
                            <RotateCcw className="size-4" />
                            Estornar
                          </Button>
                        )}
                        {payment.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => run(() => cancelPaymentAction(payment.id), "Pagamento cancelado")}
                          >
                            <Ban className="size-4" />
                            Cancelar cobrança
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() =>
                            run(() => syncPaymentAction(payment.id), "Status lido do Mercado Pago")
                          }
                        >
                          {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          Atualizar
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!refunding} onOpenChange={(open) => !open && setRefunding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar pagamento?</DialogTitle>
            <DialogDescription>
              O dinheiro volta pro cliente pelo Mercado Pago e não tem como desfazer daqui.
              {refunding ? ` Esse pagamento foi de ${formatPrice(refunding.amount)}.` : ""}
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="refundAmount">Valor do estorno (R$)</FieldLabel>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="deixe em branco pra estornar tudo"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
            <FieldDescription>
              Estorno total leva o pedido pra &quot;Reembolsado&quot; e devolve o estoque. Estorno parcial
              só registra no histórico — o pedido segue valendo.
            </FieldDescription>
          </Field>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefunding(null)} disabled={isPending}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmRefund} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
