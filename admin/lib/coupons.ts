import "server-only";
import { prisma } from "@/lib/prisma";

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
}
