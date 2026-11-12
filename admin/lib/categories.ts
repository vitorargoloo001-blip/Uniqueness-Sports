import "server-only";
import { prisma } from "@/lib/prisma";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategory(id: string) {
  return prisma.category.findUnique({ where: { id } });
}
