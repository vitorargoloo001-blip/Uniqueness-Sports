"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatPrice } from "@/lib/format";

const chartConfig = {
  total: { label: "Faturamento", color: "var(--foreground)" },
} satisfies ChartConfig;

function formatMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  // Date.UTC + timeZone: "UTC" — o construtor local (`new Date(y, m, 1)`)
  // e toLocaleDateString sem timeZone dependem do fuso do runtime, que
  // diverge entre o servidor (SSR) e o navegador e causa hydration mismatch.
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function MonthlyRevenueChart({ data }: { data: { month: string; total: number }[] }) {
  const chartData = data.map((row) => ({ ...row, label: formatMonth(row.month) }));

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />} />
        <Bar dataKey="total" fill="var(--foreground)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
