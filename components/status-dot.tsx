import { cn } from "@/lib/utils";

type StatusDotStatus = "synced" | "syncing" | "error" | "active" | "archived";

const dotStyles: Record<StatusDotStatus, string> = {
  synced: "bg-primary shadow-glow-success",
  syncing: "bg-warning",
  error: "bg-error",
  active: "bg-primary shadow-glow-success",
  archived: "bg-muted",
};

export function StatusDot({ status }: { status: StatusDotStatus }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", dotStyles[status])} />;
}
