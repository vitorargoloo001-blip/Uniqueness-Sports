import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Categories from "@/components/home/Categories";

export const metadata: Metadata = {
  title: "Coleções",
  description:
    "Coleções Uniqueness Sports por categoria: suplementos, roupas, acessórios, shakers (coqueteleiras) e lifestyle esportivo.",
  alternates: { canonical: "/colecoes" },
};

export default function ColecoesPage() {
  return (
    <>
      <section className="border-b border-border bg-bg px-5 py-16 md:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <p className="reveal-item eyebrow text-xs text-gray">Coleções</p>
          <h1 className="reveal-item mt-4 font-display text-4xl uppercase text-ink md:text-5xl">
            Presença em cada detalhe.
          </h1>
          <p className="reveal-item mt-4 max-w-lg text-base leading-relaxed text-ink/80">
            Suplementos, roupas, acessórios e shakers — cada coleção com o
            mesmo padrão: qualidade sem excesso.
          </p>
        </Reveal>
      </section>
      <Categories />
    </>
  );
}
