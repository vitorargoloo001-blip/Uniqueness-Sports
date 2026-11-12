import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** O quadradinho de número do dashboard. */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Só pra número que pede atenção (prejuízo, saldo zerado). */
  tone?: "danger";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <p
          className={cn(
            "mt-2 text-xl font-semibold text-foreground",
            tone === "danger" && "text-status-danger-fg",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
