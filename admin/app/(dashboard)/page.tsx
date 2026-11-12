import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Package, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { OrdersStatusChart } from "@/components/dashboard/orders-status-chart";
import {
  ActionQueue,
  FinanceMetrics,
  ShippingMetrics,
  ShippingMetricsSkeleton,
} from "@/components/dashboard/operacao";
import { getDashboardData } from "@/lib/dashboard";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/status";

export const metadata: Metadata = { title: "Dashboard · Uniqueness Admin" };

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Faturamento saiu daqui pro bloco "Dinheiro" (components/dashboard/operacao.tsx),
  // junto com frete, descontos e estornos — os números de dinheiro ficam todos juntos.
  const metrics = [
    { label: "Pedidos pagos", value: String(data.paidOrdersCount), icon: ShoppingCart },
    { label: "Aguardando pagamento", value: String(data.pendingOrdersCount), icon: AlertTriangle },
    { label: "Produtos ativos", value: String(data.productCount), icon: Package },
    { label: "Clientes", value: String(data.customerCount), icon: Users },
    { label: "Demandas novas", value: String(data.newLeadsCount), icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da operação Uniqueness Sports.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Dinheiro</h2>
        <FinanceMetrics />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Frete</h2>
        {/* Consulta o Melhor Envio: streama sozinho pra não segurar a página. */}
        <Suspense fallback={<ShippingMetricsSkeleton />}>
          <ShippingMetrics />
        </Suspense>
      </section>

      <ActionQueue />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.salesChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersStatusChart data={data.statusChart} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/pedidos/${order.id}`} className="font-medium text-foreground hover:underline">
                          {order.orderNumber}
                        </Link>
                        <div className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</div>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                          variant={ORDER_STATUS_VARIANT[order.status] ?? "neutral"}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(Number(order.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
            ) : (
              data.lowStockProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/produtos/${product.id}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
                >
                  <span className="text-foreground">{product.name}</span>
                  <StatusBadge label={`${product.stock} un.`} variant={product.stock === 0 ? "danger" : "warning"} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
