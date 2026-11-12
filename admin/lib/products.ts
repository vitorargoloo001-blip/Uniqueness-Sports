import "server-only";
import { prisma } from "@/lib/prisma";

export async function listProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}
