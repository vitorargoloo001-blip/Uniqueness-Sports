import "server-only";
import { prisma } from "@/lib/prisma";

export async function listSiteSettings() {
  return prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] });
}
