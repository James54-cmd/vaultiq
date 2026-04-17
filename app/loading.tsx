import { VaultIQShell } from "@/components/vaultiq-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <VaultIQShell>
      <div className="space-y-6 p-4 md:p-6 xl:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </VaultIQShell>
  );
}
