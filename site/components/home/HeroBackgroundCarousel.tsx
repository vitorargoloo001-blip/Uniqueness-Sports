import Image from "next/image";

export type HeroSlide = { src: string; alt: string };

export const HERO_INTERVAL_MS = 6000;

export default function HeroBackgroundCarousel({
  slides,
  active,
  className,
}: {
  slides: HeroSlide[];
  active: number;
  className?: string;
}) {
  return (
    <>
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          } ${className ?? ""}`}
        />
      ))}
    </>
  );
}
