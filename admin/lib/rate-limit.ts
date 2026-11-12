import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type RateLimitConfig = { windowMs: number; max: number };

/**
 * Login do admin é alvo mais sensível que o do site (acesso a toda a
 * operação) — limite mais apertado. Usa a mesma tabela LoginAttempt do
 * banco compartilhado, mas com `action` próprio ("admin_login") pra não
 * misturar contagem com o login do storefront.
 */
const CONFIGS: Record<string, RateLimitConfig> = {
  "admin_login:ip": { windowMs: 15 * 60 * 1000, max: 10 },
  "admin_login:email": { windowMs: 15 * 60 * 1000, max: 5 },
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

export async function checkRateLimit(email?: string): Promise<RateLimitResult> {
  const action = "admin_login";
  const ip = await getClientIp();
  const checks = [
    { identifier: `ip:${ip}`, config: CONFIGS[`${action}:ip`] },
    ...(email
      ? [{ identifier: `email:${email.toLowerCase()}`, config: CONFIGS[`${action}:email`] }]
      : []),
  ];

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

export async function recordAttempt(success: boolean, email?: string): Promise<void> {
  const action = "admin_login";
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
