"use client";

import { useEffect, useRef } from "react";
import { createScope, type Scope, animate, stagger, onScroll } from "animejs";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  y?: number;
  staggerDelay?: number;
};

/**
 * Anima os filhos marcados com a classe `.reveal-item` (fade + subida)
 * quando o bloco entra na viewport. Escopado ao próprio root pra não
 * colidir com outras instâncias renderizadas na mesma página.
 */
export default function Reveal({
  children,
  className,
  y = 28,
  staggerDelay = 90,
}: RevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<Scope | null>(null);

  useEffect(() => {
    scopeRef.current = createScope({ root: rootRef }).add(() => {
      const targets = rootRef.current?.querySelectorAll(".reveal-item");
      if (!targets || targets.length === 0) return;

      animate(targets, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration: 800,
        delay: stagger(staggerDelay),
        ease: "outExpo",
        autoplay: onScroll({ repeat: false }),
      });
    });

    return () => scopeRef.current?.revert();
  }, [y, staggerDelay]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
