"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import type { LeadStatus } from "@/lib/generated/prisma/client";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateLeadStatusAction(id: string, status: LeadStatus): Promise<ActionResult> {
  await requireAdmin();
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/demandas");
  return { success: true, data: undefined };
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/demandas");
  return { success: true, data: undefined };
}
