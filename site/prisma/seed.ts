import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Suplementos", slug: "suplementos" },
  { name: "Roupas", slug: "roupas" },
  { name: "Acessórios", slug: "acessorios" },
  { name: "Shakers", slug: "shakers" },
  { name: "Lifestyle", slug: "lifestyle" },
] as const;

const products = [
  {
    name: "Creatina Monohidratada",
    slug: "creatina-monohidratada",
    shortDescription: "Creatina monohidratada para quem busca constância, rotina e performance no treino.",
    description:
      "A Creatina Monohidratada Uniqueness Sports representa o básico bem feito: um suplemento direto, sem excesso e com identidade forte. Criada para fazer parte da rotina de quem treina com seriedade, ela carrega a essência da marca: presença, disciplina e respeito pelo processo.",
    price: "89.90",
    stock: 100,
    imageUrl: "/products/product-creatina.png",
    category: "suplementos",
  },
  {
    name: "UNIQFIRE Termogênico",
    slug: "uniqfire-termogenico",
    shortDescription: "Termogênico em cápsulas para quem busca intensidade e disciplina na rotina.",
    description:
      "O UNIQFIRE carrega a proposta da Uniqueness Sports em uma fórmula direta, com visual forte e posicionamento claro. Um produto criado para fazer parte da rotina de quem treina com foco, consistência e presença.",
    price: "119.90",
    stock: 100,
    imageUrl: "/products/product-uniqfire.png",
    category: "suplementos",
  },
  {
    name: "Pré-Treino",
    slug: "pre-treino",
    shortDescription: "Suplemento pré-treino para acompanhar treinos intensos e rotinas consistentes.",
    description:
      "O Pré-Treino Uniqueness Sports foi pensado para quem leva o treino com seriedade e busca produtos alinhados a uma rotina de evolução. Sem linguagem exagerada. Sem promessa vazia. Apenas presença, identidade e foco no básico bem feito.",
    price: "129.90",
    stock: 100,
    imageUrl: "/products/product-pretreino.png",
    category: "suplementos",
  },
  {
    name: "Shaker Premium",
    slug: "shaker-premium",
    shortDescription: "Coqueteleira esportiva com design limpo, presença e praticidade para o dia a dia.",
    description:
      "O Shaker Premium Uniqueness Sports foi criado para acompanhar sua rotina com praticidade e identidade. Visual preto, acabamento esportivo e presença para dentro e fora da academia.",
    price: "49.90",
    stock: 100,
    imageUrl: "/products/product-shaker.png",
    category: "acessorios",
  },
  {
    name: "Camiseta Essential",
    slug: "camiseta-essential",
    shortDescription: "Camiseta esportiva com visual premium para quem vive o esporte como identidade.",
    description:
      "A Camiseta Essential traduz o estilo da Uniqueness Sports em uma peça direta, forte e versátil. Criada para quem carrega o esporte na rotina e valoriza presença dentro e fora da academia.",
    price: "129.90",
    stock: 100,
    imageUrl: "/products/product-camiseta.png",
    category: "roupas",
  },
] as const;

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    categoryBySlug.set(cat.slug, created.id);
  }

  console.log("Seeding products...");
  for (const p of products) {
    const { category, ...data } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        ...data,
        categoryId: categoryBySlug.get(category),
      },
      create: {
        ...data,
        categoryId: categoryBySlug.get(category),
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", passwordHash },
      create: { email: adminEmail, name: "Admin", role: "ADMIN", passwordHash },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.log(
      "SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não definidos — nenhum usuário admin criado. " +
        "Defina-os em .env.local e rode `npm run db:seed` de novo, ou promova um usuário " +
        "existente via Prisma Studio (`npm run db:studio`, User.role = ADMIN).",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
