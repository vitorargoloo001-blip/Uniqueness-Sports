"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  addressInputSchema,
  profileSchema,
  type AddressInput,
  type ProfileInput,
} from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      cpf: parsed.data.cpf || null,
    },
  });

  revalidatePath("/minha-conta/dados");
  return { success: true, data: undefined };
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  if (newPassword.length < 6) {
    return { success: false, error: "Nova senha deve ter no mínimo 6 caracteres" };
  }

  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    return { success: false, error: "Usuário sem senha cadastrada" };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Senha atual incorreta" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true, data: undefined };
}

export async function addAddressAction(input: AddressInput): Promise<ActionResult> {
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const userId = await requireUserId();
  const count = await prisma.address.count({ where: { userId } });

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault || count === 0) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.address.create({
      data: { ...parsed.data, userId, isDefault: parsed.data.isDefault || count === 0 },
    });
  });

  revalidatePath("/minha-conta/enderecos");
  return { success: true, data: undefined };
}

export async function updateAddressAction(
  addressId: string,
  input: AddressInput,
): Promise<ActionResult> {
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const userId = await requireUserId();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    return { success: false, error: "Endereço não encontrado" };
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.address.update({ where: { id: addressId }, data: parsed.data });
  });

  revalidatePath("/minha-conta/enderecos");
  return { success: true, data: undefined };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    return { success: false, error: "Endereço não encontrado" };
  }

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId } });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/minha-conta/enderecos");
  return { success: true, data: undefined };
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    return { success: false, error: "Endereço não encontrado" };
  }

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  revalidatePath("/minha-conta/enderecos");
  return { success: true, data: undefined };
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
