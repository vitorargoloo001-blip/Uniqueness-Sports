import { cn } from "@/lib/utils";
import type { StatusVariant } from "@/lib/status";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "bg-status-success-bg text-status-success-fg",
  warning: "bg-status-warning-bg text-status-warning-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
  info: "bg-status-info-bg text-status-info-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
};

export function StatusBadge({ label, variant }: { label: string; variant: StatusVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
      )}
    >
      {label}
    </span>
  );
}
