import "server-only";
import { prisma } from "@/lib/prisma";

export async function listLeads() {
  return prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
}
