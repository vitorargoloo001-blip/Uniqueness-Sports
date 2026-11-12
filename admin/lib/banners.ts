import "server-only";
import { prisma } from "@/lib/prisma";

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: { position: "asc" } });
}
