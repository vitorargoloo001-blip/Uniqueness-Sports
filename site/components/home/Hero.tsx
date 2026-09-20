"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createScope, type Scope, animate, stagger } from "animejs";
import HeroBackgroundCarousel, {
  type HeroSlide,
  HERO_INTERVAL_MS,
} from "@/components/home/HeroBackgroundCarousel";

const LINES = ["O ESPORTE COMO", "IDENTIDADE."];

const DESKTOP_SLIDES: HeroSlide[] = [
  { src: "/hero/creatina-1.png", alt: "Creatina Uniqueness Sports — The One" },
  { src: "/hero/creatina-promo-1.png", alt: "Creatina Uniqueness Sports — The One, 300g" },
  { src: "/hero/termogenico.png", alt: "UNIQFIRE — termogênico Uniqueness Sports" },
  { src: "/hero/uniqfire-creatina.png", alt: "UNIQFIRE e Creatina Uniqueness Sports — The One" },
  { src: "/hero/shakers-promo.png", alt: "Shakers Uniqueness Sports — praticidade e presença na sua rotina" },
];

const MOBILE_SLIDES: HeroSlide[] = [
  { src: "/hero/mobile-creatina-1.png", alt: "Creatina Uniqueness Sports — The One" },
  { src: "/hero/mobile-creatina-promo-1.png", alt: "Creatina Uniqueness Sports — The One, 300g" },
  { src: "/hero/mobile-termogenico.png", alt: "UNIQFIRE — termogênico Uniqueness Sports" },
  { src: "/hero/mobile-uniqfire-creatina.png", alt: "UNIQFIRE e Creatina Uniqueness Sports — The One" },
  { src: "/hero/mobile-shakers-promo.png", alt: "Shakers Uniqueness Sports — praticidade e presença na sua rotina" },
];

/**
 * A foto do Shakers já vem com título, texto e "ver todos" desenhados nela
 * (peça pronta, não um fundo genérico) — pra essa, a section esconde o
 * texto/CTA genérico (senão duplica) e o fundo inteiro vira um link direto
 * pra categoria, já que o "ver todos" da própria imagem não é clicável.
 */
const SLIDE_META: { promoHref?: string; promoLabel?: string }[] = [
  {},
  {},
  {},
  {},
  { promoHref: "/categorias/shakers", promoLabel: "Ver todos os shakers" },
];

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % DESKTOP_SLIDES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    scopeRef.current = createScope({ root: rootRef }).add(() => {
      animate(".hero-line", {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: stagger(110, { start: 120 }),
        ease: "outExpo",
      });

      animate(".hero-fade", {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 700,
        delay: stagger(90, { start: 480 }),
        ease: "outQuad",
      });

      animate(".hero-bg", {
        opacity: [0, 1],
        scale: [1.04, 1],
        duration: 900,
        ease: "outQuad",
      });
    });

    return () => scopeRef.current?.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative aspect-[941/1672] overflow-hidden border-b border-border lg:aspect-auto"
    >
      {/* Fundo full-bleed em toda a section, no mobile e no desktop — a
          altura do mobile segue a proporção real das fotos da pasta Hero
          Celular (941x1672) pra não cortar nem o topo (onde vai o texto)
          nem o produto lá embaixo. Dois conjuntos de imagem diferentes
          (retrato vs paisagem), não só CSS. */}
      <div className="hero-bg absolute inset-0 opacity-0">
        <HeroBackgroundCarousel slides={MOBILE_SLIDES} active={active} className="lg:hidden" />
        <HeroBackgroundCarousel slides={DESKTOP_SLIDES} active={active} className="hidden lg:block" />
        {/* Degrade de cima pra baixo no mobile (texto fica no topo da foto,
            produto fica embaixo) e da esquerda pra direita no desktop —
            os dois somem por completo antes de encostar no produto. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 from-0% via-black/30 via-20% to-transparent to-45% lg:bg-gradient-to-r lg:from-black/85 lg:from-0% lg:via-black/35 lg:via-40% lg:to-transparent lg:to-68%" />
      </div>

      {SLIDE_META[active]?.promoHref && (
        <Link
          href={SLIDE_META[active].promoHref!}
          aria-label={SLIDE_META[active].promoLabel}
          className="absolute inset-0 z-10"
        />
      )}

      <div
        className={`relative z-10 flex h-full flex-col justify-start px-5 pt-8 pb-12 transition-opacity duration-500 md:px-8 md:pb-16 md:pt-10 lg:justify-center lg:py-28 ${
          SLIDE_META[active]?.promoHref ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl lg:max-w-none">
          <div className="lg:max-w-xl">
            <span className="hero-fade eyebrow inline-block bg-ink px-3 py-1.5 text-[11px] text-white opacity-0">
              Suplementos. Esporte. Lifestyle.
            </span>

            <h1 className="mt-5 font-display text-5xl uppercase leading-[0.98] text-white sm:text-6xl md:text-7xl">
              {LINES.map((line) => (
                <span key={line} className="hero-line block opacity-0">
                  {line}
                </span>
              ))}
            </h1>

            <p className="hero-fade mt-6 max-w-md text-base leading-relaxed text-white/75 opacity-0 md:text-lg">
              Suplementos, roupas e acessórios esportivos para quem vive o
              treino com disciplina, consistência e personalidade.
            </p>

            <div className="hero-fade mt-8 flex flex-wrap gap-4 opacity-0">
              <Link
                href="/produtos"
                className="bg-ink px-7 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85"
              >
                Ver produtos
              </Link>
              <Link
                href="/sobre"
                className="border border-white px-7 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-ink"
              >
                Conhecer a marca
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
