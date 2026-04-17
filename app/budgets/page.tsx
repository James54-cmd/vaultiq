import { BudgetsPage } from "@/components/pages/budgets-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <BudgetsPage />
    </VaultIQShell>
  );
}
