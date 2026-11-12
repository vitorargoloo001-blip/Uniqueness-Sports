"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ORDER_STATUS_LABELS } from "@/lib/status";

const chartConfig = {
  count: { label: "Pedidos", color: "var(--foreground)" },
} satisfies ChartConfig;

export function OrdersStatusChart({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Nenhum pedido ainda.
      </div>
    );
  }

  const chartData = data.map((row) => ({
    status: ORDER_STATUS_LABELS[row.status] ?? row.status,
    count: row.count,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={56}
          fontSize={11}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--foreground)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
