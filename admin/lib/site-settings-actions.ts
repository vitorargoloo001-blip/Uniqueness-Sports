"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { siteSettingSchema, type SiteSettingInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createSiteSettingAction(input: SiteSettingInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = siteSettingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.siteSetting.findUnique({ where: { key: parsed.data.key } });
  if (existing) return { success: false, error: "Já existe uma configuração com essa chave" };

  const setting = await prisma.siteSetting.create({ data: parsed.data });
  revalidatePath("/conteudo");
  revalidatePath("/configuracoes");
  return { success: true, data: { id: setting.id } };
}

export async function updateSiteSettingValueAction(id: string, value: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.siteSetting.update({ where: { id }, data: { value } });
  revalidatePath("/conteudo");
  revalidatePath("/configuracoes");
  return { success: true, data: undefined };
}

export async function deleteSiteSettingAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.siteSetting.delete({ where: { id } });
  revalidatePath("/conteudo");
  revalidatePath("/configuracoes");
  return { success: true, data: undefined };
}
