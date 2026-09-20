/**
 * Copy fixo de SEO/conteúdo por categoria — curado à mão, não vem do banco.
 * Categoria sem entrada aqui cai no fallback genérico (ver uso em
 * app/categorias/[categoria]/page.tsx). Adicionar uma entrada nova quando
 * uma categoria ganhar copy dedicado.
 */
export type CategoryCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  cardBlurb: string;
};

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  suplementos: {
    metaTitle: "Suplementos Esportivos",
    metaDescription:
      "Conheça os suplementos esportivos da Uniqueness Sports: produtos para quem treina com constância, disciplina e foco em performance.",
    h1: "Suplementos esportivos",
    intro:
      "Produtos desenvolvidos para fazer parte da rotina de quem leva o treino a sério. Sem excesso, sem promessa vazia. Apenas suplementos com qualidade, identidade e propósito.",
    cardBlurb: "Produtos para complementar sua rotina de treino.",
  },
  roupas: {
    metaTitle: "Roupas Fitness e Lifestyle",
    metaDescription:
      "Roupas esportivas com estética premium, presença e identidade para quem vive o esporte dentro e fora da academia.",
    h1: "Roupas esportivas",
    intro:
      "Peças criadas para representar a cultura Uniqueness: visual forte, conforto e presença para sua rotina esportiva.",
    cardBlurb: "Peças com identidade para dentro e fora da academia.",
  },
  acessorios: {
    metaTitle: "Acessórios Esportivos",
    metaDescription:
      "Acessórios esportivos para treino, rotina e lifestyle. Funcionalidade, presença e identidade em cada detalhe.",
    h1: "Acessórios esportivos",
    intro:
      "Itens pensados para acompanhar sua rotina de treino com praticidade, qualidade e estética alinhada à identidade Uniqueness.",
    cardBlurb: "Itens funcionais para acompanhar sua evolução.",
  },
  shakers: {
    metaTitle: "Coqueteleiras e Shakers",
    metaDescription:
      "Coqueteleiras esportivas para sua rotina de suplementos. Design premium, praticidade e presença no treino.",
    h1: "Coqueteleiras e shakers",
    intro:
      "Praticidade para sua rotina esportiva com visual forte, limpo e alinhado ao estilo Uniqueness Sports.",
    cardBlurb: "Praticidade e presença na sua rotina.",
  },
  lifestyle: {
    metaTitle: "Lifestyle Esportivo",
    metaDescription:
      "Produtos Uniqueness Sports que carregam o esporte como identidade, dentro e fora do treino.",
    h1: "Lifestyle esportivo",
    intro: "O esporte como parte da sua identidade — em cada peça, em cada detalhe.",
    cardBlurb: "O esporte como parte da sua identidade.",
  },
};

export function getCategoryCopy(slug: string, fallbackName: string): CategoryCopy {
  return (
    CATEGORY_COPY[slug] ?? {
      metaTitle: fallbackName,
      metaDescription: `${fallbackName} Uniqueness Sports: qualidade sem excesso, pra quem treina com constância. Veja o catálogo completo e compre com entrega pra todo o Brasil.`,
      h1: fallbackName,
      intro: `Catálogo ${fallbackName.toLowerCase()} Uniqueness Sports.`,
      cardBlurb: "",
    }
  );
}
