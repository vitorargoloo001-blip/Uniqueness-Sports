"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { couponSchema, type CouponInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function toData(data: CouponInput) {
  return {
    code: data.code,
    type: data.type,
    value: data.value,
    minOrderValue: data.minOrderValue || null,
    maxUses: data.maxUses || null,
    isActive: data.isActive,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    productId: data.scope === "PRODUCT" ? data.productId : null,
    categoryId: data.scope === "CATEGORY" ? data.categoryId : null,
  };
}

export async function createCouponAction(input: CouponInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { success: false, error: "Já existe um cupom com esse código" };

  const coupon = await prisma.coupon.create({ data: toData(parsed.data) });
  revalidatePath("/cupons");
  return { success: true, data: { id: coupon.id } };
}

export async function updateCouponAction(id: string, input: CouponInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.coupon.findFirst({ where: { code: parsed.data.code, NOT: { id } } });
  if (existing) return { success: false, error: "Já existe um cupom com esse código" };

  await prisma.coupon.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/cupons");
  return { success: true, data: undefined };
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/cupons");
  return { success: true, data: undefined };
}

export async function toggleCouponActiveAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return { success: false, error: "Cupom não encontrado" };

  await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/cupons");
  return { success: true, data: undefined };
}
