import { TransactionsView } from "@/features/transactions";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <TransactionsView />
    </VaultIQShell>
  );
}
