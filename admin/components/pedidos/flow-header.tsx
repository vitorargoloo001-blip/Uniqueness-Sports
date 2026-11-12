import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLOW_STAGES, type FlowStatus } from "@/lib/status";

/** Título da etapa + as três etapas em sequência, com quantos pedidos há em cada. */
export function FlowHeader({
  title,
  description,
  current,
  counts,
}: {
  title: string;
  description: string;
  current: FlowStatus;
  counts: Record<FlowStatus, number>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <nav aria-label="Etapas do envio" className="flex flex-wrap items-center gap-1.5">
        {FLOW_STAGES.map((stage, i) => {
          const active = stage.status === current;
          return (
            <Fragment key={stage.status}>
              {i > 0 && <ChevronRight className="size-4 text-muted-foreground" aria-hidden />}
              <Link
                href={stage.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                {stage.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {counts[stage.status]}
                </span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
