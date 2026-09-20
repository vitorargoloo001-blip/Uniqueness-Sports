import { formatOfferValue } from "@/lib/format";
import type { ProductOffer } from "@/lib/products";

export default function OfferBadge({ offer, className = "" }: { offer: ProductOffer; className?: string }) {
  return (
    <span className={`eyebrow inline-flex items-center gap-1.5 bg-black px-2 py-1 text-[10px] text-white ${className}`}>
      Oferta · {formatOfferValue(offer)} · {offer.code}
    </span>
  );
}
