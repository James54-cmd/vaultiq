import { AccountsPage } from "@/components/pages/accounts-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <AccountsPage />
    </VaultIQShell>
  );
}
