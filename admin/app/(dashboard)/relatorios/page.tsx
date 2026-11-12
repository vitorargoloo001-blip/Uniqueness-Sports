import type { Metadata } from "next";
import { getReportsData } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MonthlyRevenueChart } from "@/components/relatorios/monthly-revenue-chart";
import { formatPrice } from "@/lib/format";
import { PAYMENT_STATUS_LABELS } from "@/lib/status";

export const metadata: Metadata = { title: "Relatórios · Uniqueness Admin" };

export default async function RelatoriosPage() {
  const data = await getReportsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Vendas dos últimos 12 meses.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Faturamento (12m)</span>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatPrice(data.totalRevenue12m)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Pedidos pagos (12m)</span>
            <p className="mt-2 text-xl font-semibold text-foreground">{data.paidOrdersCount12m}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Ticket médio</span>
            <p className="mt-2 text-xl font-semibold text-foreground">{formatPrice(data.averageOrderValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Produtos no ranking</span>
            <p className="mt-2 text-xl font-semibold text-foreground">{data.topProducts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Faturamento por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyRevenueChart data={data.monthlyRevenue} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(product.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pedidos por status de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ordersByPaymentStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>{PAYMENT_STATUS_LABELS[row.status] ?? row.status}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
