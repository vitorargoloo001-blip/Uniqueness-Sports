/**
 * Utilitário puro (sem Prisma) — seguro em Client/Server Components.
 * Fonte única da URL base do site: NEXT_PUBLIC_SITE_URL aponta pro domínio
 * certo em cada ambiente (localhost em dev, https://uniquenessports.com.br
 * em produção, desde o corte de domínio de 2026-08-29). Nunca hardcode a
 * URL em metadata/JSON-LD — importe daqui.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "Uniqueness Sports";

/** A linha que resume a marca — usada no Organization JSON-LD e como referência de tom. */
export const BRAND_TAGLINE =
  "Uniqueness Sports: suplementos, roupas e acessórios para quem vive o esporte com identidade.";

export const SITE_DESCRIPTION =
  "Conheça a Uniqueness Sports: suplementos, roupas, coqueteleiras e acessórios esportivos com qualidade, presença e identidade para quem vive o treino.";

export const SITE_KEYWORDS = [
  "uniqueness sports",
  "suplementos esportivos",
  "creatina monohidratada",
  "termogênico",
  "pré-treino",
  "coqueteleira esportiva",
  "roupas fitness",
  "acessórios esportivos",
  "loja de suplementos",
  "produtos para treino",
  "lifestyle esportivo",
];

/** robots: noindex — pra rotas privadas, transacionais ou de conteúdo duplicado. */
export const NOINDEX = { robots: { index: false, follow: false } } as const;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
