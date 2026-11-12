import Link from "next/link";
import {
  DollarSign,
  Truck,
  Tag,
  RotateCcw,
  Receipt,
  Scale,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { formatPrice } from "@/lib/format";
import { getActionQueue, getFinanceSummary, getShippingBalance, getShippingMargin } from "@/lib/operacao";

/** Dinheiro que entrou e saiu — tudo do banco, carrega junto com a página. */
export async function FinanceMetrics() {
  const f = await getFinanceSummary();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label="Faturamento (pago)" value={formatPrice(f.faturamento)} icon={DollarSign} />
      <MetricCard
        label="Frete cobrado"
        value={formatPrice(f.freteCobrado)}
        icon={Truck}
        hint="O que os clientes pagaram de frete"
      />
      <MetricCard
        label="Descontos dados"
        value={formatPrice(f.descontos)}
        icon={Tag}
        hint="Cupons aplicados em pedidos pagos"
      />
      <MetricCard
        label="Estornado"
        value={formatPrice(f.estornado)}
        icon={RotateCcw}
        tone={f.estornado > 0 ? "danger" : undefined}
        hint="Inclui estorno parcial"
      />
    </div>
  );
}

/**
 * Frete e saldo vêm da API do Melhor Envio — lentos e podem cair, então
 * rodam dentro de um Suspense e cada um degrada sozinho.
 */
export async function ShippingMetrics() {
  const [margin, balance] = await Promise.all([getShippingMargin(), getShippingBalance()]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <MetricCard
        label="Custo das etiquetas"
        value={margin.success ? formatPrice(margin.data.custo) : "—"}
        icon={Receipt}
        hint={
          margin.success
            ? `${margin.data.etiquetas} etiqueta(s) paga(s)`
            : "Melhor Envio não respondeu"
        }
      />
      <MetricCard
        label="Margem do frete"
        value={margin.success ? formatPrice(margin.data.margem) : "—"}
        icon={Scale}
        tone={margin.success && margin.data.margem < 0 ? "danger" : undefined}
        hint={
          margin.success
            ? `${formatPrice(margin.data.cobrado)} cobrado − ${formatPrice(margin.data.custo)} de etiqueta`
            : "Melhor Envio não respondeu"
        }
      />
      <MetricCard
        label="Saldo Melhor Envio"
        value={balance.success ? formatPrice(balance.balance) : "—"}
        icon={Wallet}
        tone={balance.success && balance.balance <= 0 ? "danger" : undefined}
        hint={balance.success ? "Usado pra comprar etiqueta" : balance.error}
      />
    </div>
  );
}

export function ShippingMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** O que está parado esperando uma ação — com link direto pro pedido. */
export async function ActionQueue() {
  const groups = await getActionQueue();
  const total = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Precisa de você</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" />
            Nenhum envio parado. Tudo em dia.
          </p>
        ) : (
          groups
            .filter((group) => group.count > 0)
            .map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={String(group.count)} variant={group.tone} />
                  <span className="text-sm text-foreground">{group.label}</span>
                  <span className="text-xs text-muted-foreground">{group.hint}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/pedidos/${order.id}`}
                      className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-secondary"
                    >
                      {order.orderNumber}
                      <span className="ml-1.5 text-muted-foreground">{order.customerName}</span>
                    </Link>
                  ))}
                  {group.count > group.orders.length && (
                    <span className="self-center text-xs text-muted-foreground">
                      +{group.count - group.orders.length}
                    </span>
                  )}
                </div>
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}
