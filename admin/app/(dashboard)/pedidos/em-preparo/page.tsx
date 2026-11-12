import type { Metadata } from "next";
import { getFlowCounts, getPreparingOrders } from "@/lib/fluxo";
import { FlowHeader } from "@/components/pedidos/flow-header";
import { PreparingOrdersList } from "@/components/pedidos/flow-lists";

export const metadata: Metadata = { title: "Em preparo · Uniqueness Admin" };

export const maxDuration = 60;

export default async function PedidosEmPreparoPage() {
  const [counts, orders] = await Promise.all([getFlowCounts(), getPreparingOrders()]);

  return (
    <div className="space-y-6">
      <FlowHeader
        title="Em preparo"
        description="Separe os produtos, imprima as etiquetas e marque como postado depois de deixar na agência."
        current="PROCESSING"
        counts={counts}
      />
      <PreparingOrdersList orders={orders} />
    </div>
  );
}
