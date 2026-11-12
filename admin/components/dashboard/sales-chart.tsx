"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatPrice } from "@/lib/format";

const chartConfig = {
  total: { label: "Faturamento", color: "var(--foreground)" },
} satisfies ChartConfig;

export function SalesChart({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Sem vendas pagas nos últimos 30 dias.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) =>
            // value é "YYYY-MM-DD" (data pura, sem hora) — new Date() já
            // interpreta isso como meia-noite UTC, então formatar de volta
            // em UTC mantém o mesmo dia em qualquer timezone (server ou
            // navegador), evitando tanto off-by-one quanto hydration mismatch.
            new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(value).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "UTC",
                })
              }
              formatter={(value) => formatPrice(Number(value))}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#fillTotal)"
          stroke="var(--foreground)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
