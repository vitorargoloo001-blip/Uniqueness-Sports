type MarqueeProps = {
  children: React.ReactNode;
  direction?: "left" | "right";
  duration?: number;
  gap?: number;
  className?: string;
};

/**
 * Esteira infinita — duplica o conteúdo e anima as duas cópias em paralelo,
 * cada uma se deslocando -100%-gap da própria largura. Como as cópias são
 * idênticas, quando a animação reinicia (infinite) o quadro é indistinguível
 * do anterior — loop sem emenda visível, sem depender da largura real do
 * conteúdo (ver comentário no keyframe em globals.css).
 */
export default function Marquee({
  children,
  direction = "left",
  duration = 30,
  gap = 32,
  className,
}: MarqueeProps) {
  const animationName = direction === "left" ? "marquee-left" : "marquee-right";

  const trackStyle: React.CSSProperties = {
    gap: `${gap}px`,
    animationName,
    animationDuration: `${duration}s`,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  };

  return (
    <div className={`group overflow-hidden ${className ?? ""}`}>
      <div
        className="flex w-max"
        style={{ gap: `${gap}px`, ["--marquee-gap" as string]: `${gap}px` }}
      >
        <div
          className="flex shrink-0 items-stretch [animation-play-state:running] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
          style={trackStyle}
        >
          {children}
        </div>
        <div
          className="flex shrink-0 items-stretch [animation-play-state:running] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
          style={trackStyle}
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
