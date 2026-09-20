import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Manifesto from "@/components/Manifesto";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "A Uniqueness Sports é uma marca de suplementos, roupas, acessórios, coqueteleiras e lifestyle esportivo — fabricação própria, sem promessa exagerada.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <>
      <section className="border-b border-border bg-bg px-5 py-16 md:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <p className="reveal-item eyebrow text-xs text-gray">
            Nossa história
          </p>
          <h1 className="reveal-item mt-4 font-display text-4xl uppercase leading-[1.02] text-ink md:text-6xl">
            O esporte como identidade.
          </h1>
          <div className="reveal-item mt-8 space-y-5 text-base leading-relaxed text-ink/80 md:text-lg">
            <p>
              A Uniqueness Sports não é só creatina. É uma marca de
              suplementos, roupas, acessórios e lifestyle pra quem vive o
              esporte com disciplina, consistência e personalidade.
            </p>
            <p>
              Fabricamos nossos próprios suplementos e desenvolvemos produtos
              esportivos pensados pra quem treina de verdade — performance
              começa no respeito pelo básico, não em promessa exagerada.
            </p>
            <p>
              Qualidade sem excesso. Presença em cada detalhe. Feito para
              quem respeita o processo.
            </p>
          </div>
        </Reveal>
      </section>

      <Manifesto />
      <FinalCTA />
    </>
  );
}
