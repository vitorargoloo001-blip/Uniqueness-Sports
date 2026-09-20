import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";

const CATEGORIES = [
  { title: "Suplementos", href: "/categorias/suplementos", blurb: "Produtos para complementar sua rotina de treino.", image: "/categorias/suplementos.png" },
  { title: "Roupas", href: "/categorias/roupas", blurb: "Peças com identidade para dentro e fora da academia.", image: "/categorias/roupas.png" },
  { title: "Acessórios", href: "/categorias/acessorios", blurb: "Itens funcionais para acompanhar sua evolução.", image: "/categorias/acessorios.png" },
  { title: "Shakers", href: "/categorias/shakers", blurb: "Praticidade e presença na sua rotina.", image: "/categorias/shakers.png" },
  { title: "Lifestyle", href: "/lifestyle", blurb: "O esporte como parte da sua identidade.", image: "/categorias/lifestyle.png" },
];

export default function Categories() {
  return (
    <section className="border-b border-border bg-bg py-16">
      <Reveal className="mx-auto max-w-7xl px-5 md:px-8">
        <h2 className="reveal-item font-display text-3xl uppercase text-ink md:text-4xl">
          Compre por categoria
        </h2>
      </Reveal>

      <div className="mt-8">
        <Marquee direction="right" duration={32} gap={16}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative flex h-56 w-64 shrink-0 flex-col justify-end overflow-hidden bg-graphite p-5"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="256px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-80" />
              <span className="relative font-display text-xl uppercase leading-tight text-white transition-transform duration-300 group-hover:scale-[1.03]">
                {cat.title}
              </span>
              <span className="relative mt-1 max-w-[85%] text-xs leading-snug text-white/70">
                {cat.blurb}
              </span>
              <span className="relative mt-2 text-xs uppercase tracking-[0.1em] text-white/70">
                Ver todos →
              </span>
            </Link>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
