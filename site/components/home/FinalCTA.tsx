import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function FinalCTA() {
  return (
    <section className="bg-black px-5 py-16 text-white md:px-8">
      <Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="reveal-item">
          <h2 className="font-display text-2xl uppercase leading-tight sm:text-3xl md:text-4xl">
            Entre no universo Uniqueness Sports
          </h2>
          <p className="mt-2 text-sm text-white/65">
            Produtos criados para quem treina com seriedade, vive o esporte com
            identidade e não se contenta com o comum.
          </p>
        </div>
        <Link
          href="/produtos"
          className="reveal-item shrink-0 border border-white px-8 py-4 font-heading text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black"
        >
          Ver produtos
        </Link>
      </Reveal>
    </section>
  );
}
