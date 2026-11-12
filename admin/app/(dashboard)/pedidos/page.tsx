import type { Metadata } from "next";
import { listOrders } from "@/lib/orders";
import { OrdersTable } from "@/components/pedidos/orders-table";

export const metadata: Metadata = { title: "Pedidos · Uniqueness Admin" };

export default async function PedidosPage() {
  const orders = await listOrders();
  const data = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: Number(o.total),
    createdAt: o.createdAt,
    _count: o._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe vendas, pagamentos e entregas.</p>
      </div>
      <OrdersTable orders={data} />
    </div>
  );
}
