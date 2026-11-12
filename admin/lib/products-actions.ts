"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteImageAction } from "@/lib/upload-actions";
import { productSchema, type ProductInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function toDecimalData(data: ProductInput) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
    price: data.price,
    compareAtPrice: data.compareAtPrice || null,
    sku: data.sku || null,
    stock: data.stock,
    imageUrl: data.imageUrl || null,
    isActive: data.isActive,
    categoryId: data.categoryId || null,
    weightGrams: data.weightGrams,
    unitsPerBox: data.unitsPerBox,
    heightCm: data.heightCm,
    widthCm: data.widthCm,
    lengthCm: data.lengthCm,
  };
}

export async function createProductAction(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { success: false, error: "Já existe um produto com esse slug" };

  const product = await prisma.product.create({ data: toDecimalData(parsed.data) });
  revalidatePath("/produtos");
  return { success: true, data: { id: product.id } };
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.product.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (existing) return { success: false, error: "Já existe um produto com esse slug" };

  await prisma.product.update({ where: { id }, data: toDecimalData(parsed.data) });
  revalidatePath("/produtos");
  revalidatePath(`/produtos/${id}`);
  return { success: true, data: undefined };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    const product = await prisma.product.delete({ where: { id } });
    if (product.imageUrl) await deleteImageAction(product.imageUrl).catch(() => {});
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return {
        success: false,
        error: "Esse produto está em carrinhos de clientes agora — desative-o em vez de excluir.",
      };
    }
    throw err;
  }

  revalidatePath("/produtos");
  return { success: true, data: undefined };
}

export async function toggleProductActiveAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { success: false, error: "Produto não encontrado" };

  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  revalidatePath("/produtos");
  return { success: true, data: undefined };
}

export async function updateStockAction(id: string, stock: number): Promise<ActionResult> {
  await requireAdmin();
  if (stock < 0) return { success: false, error: "Estoque não pode ser negativo" };

  await prisma.product.update({ where: { id }, data: { stock } });
  revalidatePath("/produtos");
  return { success: true, data: undefined };
}
