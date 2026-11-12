/**
 * Utilitários puros de formatação — sem import de Prisma/DB, seguro pra
 * usar em Client Components.
 */

export function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * timeZone fixo em ambos — sem isso, o servidor (Vercel, provavelmente UTC)
 * e o navegador do usuário (horário de Brasília) formatam a mesma Date de
 * jeitos diferentes, e como esses formatters rodam dentro de Client
 * Components renderizados por SSR (células de tabela), a divergência causa
 * "Minified React error #418" (hydration mismatch) em produção.
 */
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
