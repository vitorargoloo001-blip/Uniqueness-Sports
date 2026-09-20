import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type RateLimitAction = "login" | "register";

type RateLimitConfig = { windowMs: number; max: number };

/**
 * Limites por identificador. IP protege contra um único atacante testando
 * muitas contas; email protege uma conta específica sendo atacada de vários
 * IPs. Só tentativas malsucedidas contam pro limite — login legítimo
 * repetido (várias abas/dispositivos) não deve travar o usuário.
 */
const CONFIGS: Record<string, RateLimitConfig> = {
  "login:ip": { windowMs: 15 * 60 * 1000, max: 15 },
  "login:email": { windowMs: 15 * 60 * 1000, max: 5 },
  "register:ip": { windowMs: 60 * 60 * 1000, max: 5 },
};

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function checkRateLimit(
  action: RateLimitAction,
  email?: string,
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const checks = [
    { identifier: `ip:${ip}`, config: CONFIGS[`${action}:ip`] },
    ...(email
      ? [{ identifier: `email:${email.toLowerCase()}`, config: CONFIGS[`${action}:email`] }]
      : []),
  ].filter((c): c is { identifier: string; config: RateLimitConfig } => Boolean(c.config));

  for (const { identifier, config } of checks) {
    const since = new Date(Date.now() - config.windowMs);
    const [count, oldest] = await Promise.all([
      prisma.loginAttempt.count({
        where: { identifier, action, success: false, createdAt: { gte: since } },
      }),
      prisma.loginAttempt.findFirst({
        where: { identifier, action, success: false, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (count >= config.max) {
      const retryAfterMs = oldest
        ? config.windowMs - (Date.now() - oldest.createdAt.getTime())
        : config.windowMs;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
  }

  return { allowed: true };
}

export async function recordAttempt(
  action: RateLimitAction,
  success: boolean,
  email?: string,
): Promise<void> {
  const ip = await getClientIp();
  await prisma.loginAttempt.createMany({
    data: [
      { identifier: `ip:${ip}`, action, success },
      ...(email ? [{ identifier: `email:${email.toLowerCase()}`, action, success }] : []),
    ],
  });
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} segundo(s)`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto(s)`;
}
