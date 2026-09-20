import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function BrandLifestyle() {
  return (
    <section className="border-b border-border bg-surface px-5 py-16 md:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="reveal-item order-2 lg:order-1">
          <p className="eyebrow text-xs text-gray">Nossa essência</p>
          <h2 className="mt-3 font-display text-3xl uppercase leading-[1.02] text-ink md:text-4xl">
            Mais que produtos,
            <br />
            um estilo de vida.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-gray">
            A Uniqueness Sports nasceu para quem entende que treino não é
            fase. É rotina, presença e construção diária.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-gray">
            Criamos produtos esportivos com identidade forte, visual premium
            e proposta direta: acompanhar quem faz a própria parte.
          </p>
          <Link
            href="/sobre"
            className="mt-8 inline-block border border-ink px-7 py-3 font-heading text-xs uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Conheça nossa história
          </Link>
        </div>

        <div className="reveal-item relative order-1 aspect-[4/5] overflow-hidden bg-graphite lg:order-2">
          <Image
            src="/identidade/essencia-lifestyle.png"
            alt="Atleta treinando com camiseta Uniqueness Sports"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
    </section>
  );
}
