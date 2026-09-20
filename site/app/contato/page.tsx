import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { generalWhatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Uniqueness Sports pelo WhatsApp, e-mail ou redes sociais.",
  alternates: { canonical: "/contato" },
};

const CHANNELS = [
  {
    title: "WhatsApp",
    detail: "Resposta mais rápida — pedidos, dúvidas e suporte.",
    href: generalWhatsappLink(),
    cta: "Abrir conversa →",
  },
  {
    title: "E-mail",
    detail: "contato@uniquenessports.com.br",
    href: "mailto:contato@uniquenessports.com.br",
    cta: "Enviar e-mail →",
  },
  {
    title: "Instagram",
    detail: "Bastidores, lançamentos e comunidade.",
    href: "https://www.instagram.com/uniqueness_sports",
    cta: "Seguir →",
  },
];

export default function ContatoPage() {
  return (
    <section className="px-5 py-16 md:px-8">
      <Reveal className="mx-auto max-w-4xl">
        <p className="reveal-item eyebrow text-xs text-gray">Contato</p>
        <h1 className="reveal-item mt-4 font-display text-4xl uppercase text-ink md:text-5xl">
          Fala com a gente.
        </h1>
        <p className="reveal-item mt-4 max-w-lg text-base leading-relaxed text-ink/75">
          Atendimento direto, sem enrolação. Escolhe o canal e fala com a
          gente.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-item flex flex-col justify-between border border-border bg-surface p-6 transition-shadow hover:shadow-[0_16px_32px_-16px_rgba(10,10,10,0.18)]"
            >
              <div>
                <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
                  {channel.title}
                </h2>
                <p className="mt-2 text-sm text-gray">{channel.detail}</p>
              </div>
              <p className="mt-6 font-heading text-xs uppercase tracking-[0.14em] text-ink">
                {channel.cta}
              </p>
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
