import "server-only";
import { prisma } from "@/lib/prisma";

export async function listAdminUsers() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}
