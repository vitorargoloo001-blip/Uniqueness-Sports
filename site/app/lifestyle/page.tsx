import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import BrandLifestyle from "@/components/home/BrandLifestyle";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Lifestyle",
  description:
    "Bastidores, lançamentos e a conduta por trás da Uniqueness Sports — disciplina e constância dentro e fora do treino.",
  alternates: { canonical: "/lifestyle" },
};

export default function LifestylePage() {
  return (
    <>
      <section className="border-b border-border bg-bg px-5 py-16 md:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <p className="reveal-item eyebrow text-xs text-gray">Lifestyle</p>
          <h1 className="reveal-item mt-4 font-display text-4xl uppercase text-ink md:text-5xl">
            Mais que treino. Conduta.
          </h1>
          <p className="reveal-item mt-4 max-w-lg text-base leading-relaxed text-ink/80">
            Disciplina, constância e presença — dentro e fora do treino.
            Acompanha bastidores, lançamentos e a comunidade Uniqueness no
            Instagram.
          </p>
        </Reveal>
      </section>
      <BrandLifestyle />
      <FinalCTA />
    </>
  );
}
