"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  PackageCheck,
  PackageOpen,
  Printer,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  markDeliveredAction,
  markShippedAction,
  printLabelsAction,
  startPreparationAction,
} from "@/lib/fluxo-actions";
import { syncShipmentsAction } from "@/lib/shipping-actions";
import type { BatchOutcome, NewOrder, PreparingOrder, ShippedOrder } from "@/lib/fluxo";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// ---------------------------------------------------------------------------
// Peças compartilhadas pelas três etapas
// ---------------------------------------------------------------------------

/**
 * Seleção de pedidos. Guarda ids, mas só conta os que ainda estão na lista e
 * podem ser selecionados — pedido que avançou de etapa sai da seleção sozinho.
 */
function useSelection(selectableIds: string[]) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const selected = selectableIds.filter((id) => picked.has(id));
  const all = selectableIds.length > 0 && selected.length === selectableIds.length;

  return {
    selected,
    has: (id: string) => selected.includes(id),
    toggle: (id: string) =>
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () => setPicked(all ? new Set() : new Set(selectableIds)),
    checkedAll: all ? true : selected.length > 0 ? ("indeterminate" as const) : false,
    none: selectableIds.length === 0,
    clear: () => setPicked(new Set()),
  };
}

type Selection = ReturnType<typeof useSelection>;

/** Toast do resultado em lote, com atalho pra próxima etapa. Cada pedido que falhou ganha o seu. */
function useReport() {
  const router = useRouter();
  return (
    result: ActionResult<BatchOutcome>,
    success: (done: number) => string,
    next?: { label: string; href: string },
  ) => {
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const { done, errors } = result.data;
    if (done > 0) {
      toast.success(
        success(done),
        next ? { action: { label: next.label, onClick: () => router.push(next.href) } } : undefined,
      );
    }
    for (const e of errors) toast.error(`${e.orderNumber}: ${e.error}`, { duration: 10_000 });
  };
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function itemsText(items: { name: string; quantity: number }[]) {
  return items.map((item) => `${item.quantity}× ${item.name}`).join(" · ");
}

/** Pede ao site pra reprocessar envios e puxar status/rastreio do Melhor Envio (mesma rotina do cron). */
function SyncButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function sync() {
    startTransition(async () => {
      const r = await syncShipmentsAction();
      if (!r.success) toast.error(r.error);
      else toast.success(`Sincronizado: ${r.data.sent} enviado(s), ${r.data.synced} atualizado(s)`);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={sync} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {label}
    </Button>
  );
}

function Toolbar({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {aside && <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{aside}</div>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4" />
        {children}
      </CardContent>
    </Card>
  );
}

function OrdersTable({ selection, head, children }: { selection: Selection; head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selection.checkedAll}
                onCheckedChange={selection.toggleAll}
                disabled={selection.none}
                aria-label="Selecionar todos"
              />
            </TableHead>
            {head.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function SelectCell({ selection, id, label, disabled }: { selection: Selection; id: string; label: string; disabled?: boolean }) {
  return (
    <TableCell className="w-10 align-top">
      <Checkbox
        checked={selection.has(id)}
        onCheckedChange={() => selection.toggle(id)}
        disabled={disabled}
        aria-label={`Selecionar ${label}`}
      />
    </TableCell>
  );
}

function OrderCell({ id, orderNumber, sub }: { id: string; orderNumber: string; sub: ReactNode }) {
  return (
    <TableCell className="align-top">
      <Link href={`/pedidos/${id}`} className="font-medium text-foreground hover:underline">
        {orderNumber}
      </Link>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </TableCell>
  );
}

function CustomerCell({ name, city }: { name: string; city: string }) {
  return (
    <TableCell className="align-top">
      <div className="text-foreground">{name}</div>
      <div className="text-xs text-muted-foreground">{city}</div>
    </TableCell>
  );
}

// ---------------------------------------------------------------------------
// 1. Pedidos novos
// ---------------------------------------------------------------------------

export function NewOrdersList({
  orders,
  balance,
  balanceError,
}: {
  orders: NewOrder[];
  balance: number | null;
  balanceError: string | null;
}) {
  const router = useRouter();
  const report = useReport();
  const [isPending, startTransition] = useTransition();
  const selection = useSelection(orders.filter((o) => o.shipment.canPrepare).map((o) => o.id));
  const toBuy = orders.filter((o) => selection.has(o.id) && o.shipment.state === "comprar").length;

  function start() {
    startTransition(async () => {
      report(
        await startPreparationAction(selection.selected),
        (n) => `${plural(n, "pedido foi", "pedidos foram")} pro preparo`,
        { label: "Ver em preparo", href: "/pedidos/em-preparo" },
      );
      selection.clear();
      router.refresh();
    });
  }

  if (orders.length === 0) {
    return <Empty>Nenhum pedido novo. Quando um pagamento aprova, o pedido aparece aqui.</Empty>;
  }

  return (
    <div className="space-y-3">
      <Toolbar
        aside={
          <>
            {balanceError ? (
              <span className="text-destructive" title={balanceError}>
                Saldo do Melhor Envio indisponível
              </span>
            ) : (
              balance !== null && (
                <span>
                  Saldo Melhor Envio:{" "}
                  <strong className={balance <= 0 ? "text-destructive" : "text-foreground"}>
                    {formatPrice(balance)}
                  </strong>
                </span>
              )
            )}
            <SyncButton label="Sincronizar" />
          </>
        }
      >
        <Button size="sm" onClick={start} disabled={isPending || selection.selected.length === 0}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <PackageOpen className="size-4" />}
          {toBuy > 0 ? `Comprar ${plural(toBuy, "etiqueta", "etiquetas")} e iniciar preparo` : "Iniciar preparo"}
          {selection.selected.length > 0 && ` (${selection.selected.length})`}
        </Button>
        {toBuy > 0 && balance !== null && balance <= 0 && (
          <span className="text-xs text-destructive">Sem saldo: coloque saldo no Melhor Envio antes.</span>
        )}
      </Toolbar>

      <OrdersTable selection={selection} head={["Pedido", "Cliente", "Itens", "Frete", "Envio"]}>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <SelectCell
              selection={selection}
              id={order.id}
              label={order.orderNumber}
              disabled={!order.shipment.canPrepare}
            />
            <OrderCell
              id={order.id}
              orderNumber={order.orderNumber}
              sub={`Pago ${formatDateTime(order.paidAt)} · ${formatPrice(order.total)}`}
            />
            <CustomerCell name={order.customerName} city={order.city} />
            <TableCell className="max-w-72 align-top whitespace-normal text-foreground">
              {itemsText(order.items)}
            </TableCell>
            <TableCell className="align-top">
              <div className="text-foreground">{order.service ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {order.shippingTotal > 0 ? `Cliente pagou ${formatPrice(order.shippingTotal)}` : "Frete grátis"}
                {order.deliveryDays ? ` · até ${order.deliveryDays} dias úteis` : ""}
              </div>
            </TableCell>
            <TableCell className="max-w-64 align-top whitespace-normal">
              <StatusBadge label={order.shipment.label} variant={order.shipment.variant} />
              {order.shipment.detail && (
                <p className="mt-1 text-xs text-destructive">{order.shipment.detail}</p>
              )}
            </TableCell>
          </TableRow>
        ))}
      </OrdersTable>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Em preparo
// ---------------------------------------------------------------------------

const LABEL_BADGE = {
  pronta: { label: "Etiqueta pronta", variant: "success" },
  "sem-etiqueta": { label: "Sem etiqueta gerada", variant: "danger" },
  manual: { label: "Envio manual", variant: "neutral" },
} as const;

/** Abre o PDF numa aba nova; se o navegador bloquear o pop-up, oferece o link num toast. */
function openPdf(url: string) {
  const tab = window.open(url, "_blank");
  if (tab) {
    tab.opener = null;
    return;
  }
  toast("O navegador bloqueou a nova aba.", {
    action: { label: "Abrir etiquetas", onClick: () => window.open(url, "_blank", "noopener") },
    duration: 15_000,
  });
}

export function PreparingOrdersList({ orders }: { orders: PreparingOrder[] }) {
  const router = useRouter();
  const report = useReport();
  const [isPending, startTransition] = useTransition();
  const selection = useSelection(orders.filter((o) => o.label !== "sem-etiqueta").map((o) => o.id));
  const selectedWithLabel = orders.filter((o) => selection.has(o.id) && o.label === "pronta").length;

  // Lista de separação: soma os produtos dos selecionados (ou de todos, sem seleção).
  const pickingSource = selection.selected.length > 0 ? orders.filter((o) => selection.has(o.id)) : orders;
  const pickingTotals = new Map<string, number>();
  for (const order of pickingSource) {
    for (const item of order.items) {
      pickingTotals.set(item.name, (pickingTotals.get(item.name) ?? 0) + item.quantity);
    }
  }
  const picking = {
    count: pickingSource.length,
    items: [...pickingTotals].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")),
  };

  function print() {
    startTransition(async () => {
      const r = await printLabelsAction(selection.selected);
      if (!r.success) toast.error(r.error);
      else openPdf(r.data);
    });
  }

  function markShipped() {
    startTransition(async () => {
      report(
        await markShippedAction(selection.selected),
        (n) => `${plural(n, "pedido postado", "pedidos postados")}. O cliente já vê o rastreio no site`,
        { label: "Ver postados", href: "/pedidos/postados" },
      );
      selection.clear();
      router.refresh();
    });
  }

  if (orders.length === 0) {
    return (
      <Empty>
        Nada em preparo. Os pedidos chegam aqui a partir de{" "}
        <Link href="/pedidos/novos" className="text-foreground underline">
          Pedidos novos
        </Link>
        .
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      <Toolbar>
        <Button size="sm" variant="outline" onClick={print} disabled={isPending || selectedWithLabel === 0}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
          Imprimir etiquetas{selectedWithLabel > 0 && ` (${selectedWithLabel})`}
        </Button>
        <Button size="sm" onClick={markShipped} disabled={isPending || selection.selected.length === 0}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
          Marcar como postado{selection.selected.length > 0 && ` (${selection.selected.length})`}
        </Button>
      </Toolbar>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="size-4" />
            Separar agora
            <span className="font-normal text-muted-foreground">
              {selection.selected.length > 0
                ? `${plural(picking.count, "pedido selecionado", "pedidos selecionados")}`
                : `todos os ${plural(picking.count, "pedido", "pedidos")} em preparo`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {picking.items.map(([name, quantity]) => (
              <li key={name} className="rounded-md border border-border px-2.5 py-1 text-sm">
                <strong className="tabular-nums">{quantity}×</strong> {name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <OrdersTable selection={selection} head={["Pedido", "Cliente", "Itens", "Envio"]}>
        {orders.map((order) => {
          const badge = LABEL_BADGE[order.label];
          return (
            <TableRow key={order.id}>
              <SelectCell
                selection={selection}
                id={order.id}
                label={order.orderNumber}
                disabled={order.label === "sem-etiqueta"}
              />
              <OrderCell
                id={order.id}
                orderNumber={order.orderNumber}
                sub={`Em preparo desde ${formatDateTime(order.since)}`}
              />
              <CustomerCell name={order.customerName} city={order.city} />
              <TableCell className="max-w-72 align-top whitespace-normal text-foreground">
                {itemsText(order.items)}
              </TableCell>
              <TableCell className="max-w-64 align-top whitespace-normal">
                <div className="text-foreground">{order.service ?? "—"}</div>
                <StatusBadge label={badge.label} variant={badge.variant} />
                {order.label === "sem-etiqueta" && (
                  <p className="mt-1 text-xs text-muted-foreground">Compre ou refaça a etiqueta na página do pedido.</p>
                )}
                {order.label === "manual" && !order.trackingCode && (
                  <p className="mt-1 text-xs text-muted-foreground">Informe o rastreio na página do pedido.</p>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </OrdersTable>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Postados
// ---------------------------------------------------------------------------

export function ShippedOrdersList({ orders }: { orders: ShippedOrder[] }) {
  const router = useRouter();
  const report = useReport();
  const [isPending, startTransition] = useTransition();
  const selection = useSelection(orders.map((o) => o.id));
  const late = orders.filter((o) => o.late).length;

  function markDelivered() {
    startTransition(async () => {
      report(
        await markDeliveredAction(selection.selected),
        (n) => `${plural(n, "pedido marcado", "pedidos marcados")} como entregue`,
      );
      selection.clear();
      router.refresh();
    });
  }

  if (orders.length === 0) {
    return <Empty>Nenhum pedido a caminho. Os entregues continuam em Todos os pedidos.</Empty>;
  }

  return (
    <div className="space-y-3">
      <Toolbar
        aside={
          <>
            {late > 0 && (
              <span className="text-destructive">{plural(late, "pedido passou", "pedidos passaram")} do prazo</span>
            )}
            <SyncButton label="Atualizar rastreio" />
          </>
        }
      >
        <Button size="sm" onClick={markDelivered} disabled={isPending || selection.selected.length === 0}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
          Marcar como entregue{selection.selected.length > 0 && ` (${selection.selected.length})`}
        </Button>
      </Toolbar>

      <OrdersTable selection={selection} head={["Pedido", "Cliente", "Rastreio", "Situação", "Prazo"]}>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <SelectCell selection={selection} id={order.id} label={order.orderNumber} />
            <OrderCell
              id={order.id}
              orderNumber={order.orderNumber}
              sub={`Postado ${formatDateTime(order.postedAt)}`}
            />
            <CustomerCell name={order.customerName} city={order.city} />
            <TableCell className="align-top">
              {order.trackingCode ? (
                order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-foreground underline"
                  >
                    {order.trackingCode}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-foreground">{order.trackingCode}</span>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Sem código ainda</span>
              )}
              <div className="text-xs text-muted-foreground">{order.service ?? "—"}</div>
            </TableCell>
            <TableCell className="align-top">
              {order.shipmentStatus ? (
                <StatusBadge label={order.shipmentStatus.label} variant={order.shipmentStatus.variant} />
              ) : (
                <span className="text-xs text-muted-foreground">Envio manual</span>
              )}
            </TableCell>
            <TableCell className="align-top">
              <div className={order.late ? "font-medium text-destructive" : "text-foreground"}>
                {plural(order.businessDays, "dia útil", "dias úteis")}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.deliveryDays ? `prazo: até ${order.deliveryDays}` : "sem prazo informado"}
                {order.late && " · atrasado"}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </OrdersTable>
    </div>
  );
}
