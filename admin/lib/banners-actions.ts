"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteImageAction } from "@/lib/upload-actions";
import { bannerSchema, type BannerInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function toData(data: BannerInput) {
  return {
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    position: data.position,
    isActive: data.isActive,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  };
}

export async function createBannerAction(input: BannerInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const banner = await prisma.banner.create({ data: toData(parsed.data) });
  revalidatePath("/banners");
  return { success: true, data: { id: banner.id } };
}

export async function updateBannerAction(id: string, input: BannerInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.banner.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/banners");
  return { success: true, data: undefined };
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const banner = await prisma.banner.delete({ where: { id } });
  if (banner.imageUrl) await deleteImageAction(banner.imageUrl).catch(() => {});
  revalidatePath("/banners");
  return { success: true, data: undefined };
}

export async function toggleBannerActiveAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return { success: false, error: "Banner não encontrado" };

  await prisma.banner.update({ where: { id }, data: { isActive: !banner.isActive } });
  revalidatePath("/banners");
  return { success: true, data: undefined };
}
