import "server-only";
import { auth } from "@/lib/auth";

/**
 * Reforço por Server Action, independente do proxy.ts — Proxy não cobre
 * Server Actions de forma confiável no Next 16 (mesmo padrão do site/).
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acesso restrito a administradores");
  }
  return { id: session.user.id, email: session.user.email ?? "" };
}
