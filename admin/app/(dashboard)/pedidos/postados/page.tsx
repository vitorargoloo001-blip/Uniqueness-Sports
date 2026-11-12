import type { Metadata } from "next";
import { getFlowCounts, getShippedOrders } from "@/lib/fluxo";
import { FlowHeader } from "@/components/pedidos/flow-header";
import { ShippedOrdersList } from "@/components/pedidos/flow-lists";

export const metadata: Metadata = { title: "Postados · Uniqueness Admin" };

export default async function PedidosPostadosPage() {
  const [counts, orders] = await Promise.all([getFlowCounts(), getShippedOrders()]);

  return (
    <div className="space-y-6">
      <FlowHeader
        title="Postados"
        description="A caminho do cliente. O Melhor Envio marca como entregue sozinho; aqui você acompanha prazo e rastreio."
        current="SHIPPED"
        counts={counts}
      />
      <ShippedOrdersList orders={orders} />
    </div>
  );
}
