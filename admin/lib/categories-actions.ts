"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteImageAction } from "@/lib/upload-actions";
import { categorySchema, type CategoryInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { success: false, error: "Já existe uma categoria com esse slug" };

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath("/categorias");
  return { success: true, data: { id: category.id } };
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (existing) return { success: false, error: "Já existe uma categoria com esse slug" };

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath("/categorias");
  return { success: true, data: undefined };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const category = await prisma.category.delete({ where: { id } });

  // Best-effort: não bloqueia a exclusão se a limpeza do storage falhar.
  if (category.imageUrl) await deleteImageAction(category.imageUrl).catch(() => {});

  revalidatePath("/categorias");
  revalidatePath("/produtos");
  return { success: true, data: undefined };
}
