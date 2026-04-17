import { TransactionsPage } from "@/components/pages/transactions-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <TransactionsPage />
    </VaultIQShell>
  );
}
