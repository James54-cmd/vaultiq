import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/lib/data";

const dotStyles: Record<AccountStatus, string> = {
  synced: "bg-primary shadow-glow-success",
  syncing: "bg-warning",
  error: "bg-error",
};

export function StatusDot({ status }: { status: AccountStatus }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", dotStyles[status])} />;
}
