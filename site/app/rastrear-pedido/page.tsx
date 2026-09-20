import type { Metadata } from "next";
import TrackOrderView from "@/components/TrackOrderView";

export const metadata: Metadata = {
  title: "Rastrear pedido",
  description: "Acompanhe o status e a entrega do seu pedido Uniqueness Sports.",
  alternates: { canonical: "/rastrear-pedido" },
};

export default function RastrearPedidoPage() {
  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-xs text-gray">Acompanhamento</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          Rastrear pedido
        </h1>
        <p className="mt-4 text-ink/70">
          Informe o número do pedido e o e-mail usado na compra para acompanhar sua entrega.
        </p>

        <div className="mt-10">
          <TrackOrderView />
        </div>
      </div>
    </section>
  );
}
