import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";

const PILARES = [
  {
    title: "Disciplina",
    detail: "Fazer o que precisa ser feito, mesmo quando ninguém está olhando.",
  },
  {
    title: "Constância",
    detail: "Pequenas escolhas, todos os dias, constroem legados.",
  },
  {
    title: "Respeito",
    detail: "Pelo processo, pelo próximo e pelo tempo que te sustenta.",
  },
  {
    title: "Propósito",
    detail: "Mais que conquistar resultados, deixar um impacto.",
  },
];

export default function Manifesto() {
  return (
    <section className="border-b border-border bg-surface py-16">
      <Reveal className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="reveal-item eyebrow text-center text-xs text-gray">
          Nosso manifesto
        </p>
      </Reveal>

      <div className="mt-10">
        <Marquee direction="left" duration={28} gap={24}>
          {PILARES.map((pilar) => (
            <div
              key={pilar.title}
              className="w-72 shrink-0 border-t border-ink/80 pt-4 sm:w-80"
            >
              <h3 className="font-display text-2xl uppercase text-ink">
                {pilar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray">
                {pilar.detail}
              </p>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
