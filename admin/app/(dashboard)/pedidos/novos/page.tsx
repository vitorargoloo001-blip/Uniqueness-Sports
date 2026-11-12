import type { Metadata } from "next";
import { getFlowCounts, getNewOrders } from "@/lib/fluxo";
import { getBalance } from "@/lib/melhor-envio";
import { FlowHeader } from "@/components/pedidos/flow-header";
import { NewOrdersList } from "@/components/pedidos/flow-lists";

export const metadata: Metadata = { title: "Pedidos novos · Uniqueness Admin" };

// Comprar etiqueta em lote chama o Melhor Envio pedido a pedido.
export const maxDuration = 60;

export default async function PedidosNovosPage() {
  const [counts, orders, balance] = await Promise.all([getFlowCounts(), getNewOrders(), getBalance()]);

  return (
    <div className="space-y-6">
      <FlowHeader
        title="Pedidos novos"
        description="Pagos e esperando preparo. Selecione, compre a etiqueta no Melhor Envio e mande pro preparo."
        current="PAID"
        counts={counts}
      />
      <NewOrdersList
        orders={orders}
        balance={balance.success ? balance.data.balance : null}
        balanceError={balance.success ? null : balance.error}
      />
    </div>
  );
}
