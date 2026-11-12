"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { checkRateLimit, recordAttempt, formatRetryAfter } from "@/lib/rate-limit";
import { loginSchema, type LoginInput } from "@/lib/validations";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const limit = await checkRateLimit(parsed.data.email);
  if (!limit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas. Tente novamente em ${formatRetryAfter(limit.retryAfterSeconds)}.`,
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
      await recordAttempt(false, parsed.data.email);
      return { success: false, error: "Email ou senha inválidos, ou conta sem permissão de administrador" };
    }
    throw err;
  }

  await recordAttempt(true, parsed.data.email);
  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
