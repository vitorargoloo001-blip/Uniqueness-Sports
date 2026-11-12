"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { adminUserSchema, type AdminUserInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createAdminUserAction(input: AdminUserInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = adminUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    if (existing.role === "ADMIN") return { success: false, error: "Esse email já é administrador" };
    await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    revalidatePath("/configuracoes");
    return { success: true, data: { id: existing.id } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: "ADMIN" },
  });

  revalidatePath("/configuracoes");
  return { success: true, data: { id: user.id } };
}

export async function revokeAdminAction(id: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (me.id === id) return { success: false, error: "Você não pode remover seu próprio acesso" };

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) return { success: false, error: "Precisa existir ao menos um administrador" };

  await prisma.user.update({ where: { id }, data: { role: "CUSTOMER" } });
  revalidatePath("/configuracoes");
  return { success: true, data: undefined };
}
