"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/lib/auth";
import { mergeCartOnLogin } from "@/lib/cart";
import { checkRateLimit, recordAttempt, formatRetryAfter } from "@/lib/rate-limit";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const limit = await checkRateLimit("register");
  if (!limit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas de cadastro. Tente novamente em ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    await recordAttempt("register", false);
    return { success: false, error: "Já existe uma conta com esse email" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  });
  await recordAttempt("register", true);

  return loginAction({ email: parsed.data.email, password: parsed.data.password });
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const limit = await checkRateLimit("login", parsed.data.email);
  if (!limit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas de login. Tente novamente em ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      await recordAttempt("login", false, parsed.data.email);
      return { success: false, error: "Email ou senha inválidos" };
    }
    throw err;
  }

  await recordAttempt("login", true, parsed.data.email);

  const session = await auth();
  if (session?.user?.id) {
    await mergeCartOnLogin(session.user.id);
  }

  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
