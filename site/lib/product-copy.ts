/**
 * Copy fixo de SEO/conteúdo por produto — curado à mão, não vem do banco.
 * `h1` é o título exibido na página (pode diferir do `name` salvo no banco,
 * usado em carrinho/checkout/admin). Produto sem entrada aqui cai no
 * fallback: usa os campos do banco (name/shortDescription/description).
 */
export type ProductCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  shortDescription: string;
  description: string;
  bullets: string[];
};

export const PRODUCT_COPY: Record<string, ProductCopy> = {
  "creatina-monohidratada": {
    metaTitle: "Creatina Monohidratada 300g",
    metaDescription:
      "Creatina monohidratada 300g Uniqueness Sports. Produto direto, com identidade premium e feito para quem leva o treino a sério.",
    h1: "Creatina Monohidratada 300g",
    shortDescription: "Creatina monohidratada para quem busca constância, rotina e performance no treino.",
    description:
      "A Creatina Monohidratada Uniqueness Sports representa o básico bem feito: um suplemento direto, sem excesso e com identidade forte. Criada para fazer parte da rotina de quem treina com seriedade, ela carrega a essência da marca: presença, disciplina e respeito pelo processo.",
    bullets: [
      "Creatina monohidratada",
      "300g",
      "Suplemento alimentar em pó",
      "Visual premium Uniqueness Sports",
      "Produto para rotina esportiva",
    ],
  },
  "uniqfire-termogenico": {
    metaTitle: "UNIQFIRE Termogênico",
    metaDescription:
      "UNIQFIRE é o termogênico da Uniqueness Sports: suplemento em cápsulas com identidade forte para sua rotina esportiva.",
    h1: "UNIQFIRE Termogênico",
    shortDescription: "Termogênico em cápsulas para quem busca intensidade e disciplina na rotina.",
    description:
      "O UNIQFIRE carrega a proposta da Uniqueness Sports em uma fórmula direta, com visual forte e posicionamento claro. Um produto criado para fazer parte da rotina de quem treina com foco, consistência e presença.",
    bullets: [
      "Suplemento alimentar em cápsulas",
      "60 cápsulas",
      "Identidade Uniqueness Sports",
      "Produto para rotina esportiva",
      "Visual premium preto, branco e grafite",
    ],
  },
  "pre-treino": {
    metaTitle: "Pré-Treino",
    metaDescription:
      "Pré-treino Uniqueness Sports: suplemento esportivo com presença, identidade e proposta direta para sua rotina de treino.",
    h1: "Pré-Treino Uniqueness Sports",
    shortDescription: "Suplemento pré-treino para acompanhar treinos intensos e rotinas consistentes.",
    description:
      "O Pré-Treino Uniqueness Sports foi pensado para quem leva o treino com seriedade e busca produtos alinhados a uma rotina de evolução. Sem linguagem exagerada. Sem promessa vazia. Apenas presença, identidade e foco no básico bem feito.",
    bullets: [
      "Suplemento alimentar em pó",
      "300g",
      "Identidade Uniqueness Sports",
      "Produto para rotina esportiva",
    ],
  },
  "shaker-premium": {
    metaTitle: "Shaker Premium",
    metaDescription:
      "Coqueteleira Uniqueness Sports com design premium, visual preto e identidade esportiva para sua rotina de suplementos.",
    h1: "Shaker Premium Uniqueness Sports",
    shortDescription: "Coqueteleira esportiva com design limpo, presença e praticidade para o dia a dia.",
    description:
      "O Shaker Premium Uniqueness Sports foi criado para acompanhar sua rotina com praticidade e identidade. Visual preto, acabamento esportivo e presença para dentro e fora da academia.",
    bullets: ["Coqueteleira esportiva", "700ml", "Visual preto premium", "Identidade Uniqueness Sports"],
  },
  "camiseta-essential": {
    metaTitle: "Camiseta Essential",
    metaDescription:
      "Camiseta Uniqueness Sports com estética premium, visual esportivo e identidade forte para treino e lifestyle.",
    h1: "Camiseta Essential Uniqueness Sports",
    shortDescription: "Camiseta esportiva com visual premium para quem vive o esporte como identidade.",
    description:
      "A Camiseta Essential traduz o estilo da Uniqueness Sports em uma peça direta, forte e versátil. Criada para quem carrega o esporte na rotina e valoriza presença dentro e fora da academia.",
    bullets: ["Camiseta esportiva", "Cor preta", "Identidade Uniqueness Sports", "Treino e lifestyle"],
  },
};

export function getProductCopy(
  slug: string,
  fallback: { name: string; shortDescription: string | null; description: string | null },
): ProductCopy {
  return (
    PRODUCT_COPY[slug] ?? {
      metaTitle: fallback.name,
      metaDescription:
        fallback.description ?? fallback.shortDescription ?? `${fallback.name} na loja oficial Uniqueness Sports.`,
      h1: fallback.name,
      shortDescription: fallback.shortDescription ?? "",
      description: fallback.description ?? "",
      bullets: [],
    }
  );
}
