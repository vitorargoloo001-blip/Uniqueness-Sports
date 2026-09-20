import Marquee from "@/components/Marquee";

const ICONS = {
  truck: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 7h11v9H3z" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  ),
  badge: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5 7.5 21 12 18.5 16.5 21 15 14.5" strokeLinejoin="round" />
    </svg>
  ),
  lock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  ),
  spark: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
    </svg>
  ),
};

const BENEFITS = [
  { icon: "truck", title: "Frete grátis", detail: "Em compras acima de R$ 299" },
  { icon: "badge", title: "Qualidade premium", detail: "Produtos selecionados para sua rotina esportiva" },
  { icon: "lock", title: "Compra segura", detail: "Ambiente protegido do início ao fim" },
  { icon: "spark", title: "Presença em cada detalhe", detail: "Performance, estética e identidade" },
] as const;

export default function BenefitsBar() {
  return (
    <div className="border-b border-border bg-surface py-8">
      <Marquee direction="left" duration={28} gap={56}>
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex w-[19rem] items-center gap-3 border-l border-border pl-8"
          >
            <span className="shrink-0 text-ink">{ICONS[b.icon]}</span>
            <span>
              <p className="font-heading text-xs uppercase tracking-[0.08em] text-ink">
                {b.title}
              </p>
              <p className="mt-0.5 text-xs text-gray">{b.detail}</p>
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
