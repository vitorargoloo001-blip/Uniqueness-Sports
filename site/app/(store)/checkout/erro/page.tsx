import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Pagamento não concluído", ...NOINDEX };

export default async function CheckoutErroPage({
  searchParams,
}: PageProps<"/checkout/erro">) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.order) ? params.order[0] : params.order;

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow text-xs text-gray">Pagamento</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-ink">
          Não foi possível concluir o pagamento
        </h1>
        <p className="mt-4 text-ink/70">Revise os dados ou tente novamente.</p>
        <p className="mt-2 text-sm text-gray">
          {orderNumber
            ? `O pagamento do pedido ${orderNumber} não foi aprovado ou foi cancelado. Nenhum valor foi cobrado.`
            : "Nenhum valor foi cobrado."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/checkout"
            className="bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85"
          >
            Tentar novamente
          </Link>
          <Link
            href="/contato"
            className="border border-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-ink hover:bg-[#F7F5F0]"
          >
            Falar com o suporte
          </Link>
        </div>
      </div>
    </section>
  );
}
