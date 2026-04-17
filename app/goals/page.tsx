import { GoalsPage } from "@/components/pages/goals-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <GoalsPage />
    </VaultIQShell>
  );
}
