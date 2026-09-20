import { renderOgImage, OG_SIZE } from "@/lib/og-image";

export const alt = "Uniqueness Sports — suplementos, roupas e acessórios esportivos";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage("Suplementos · Esporte · Lifestyle");
}
