import { DashboardPage } from "@/components/pages/dashboard-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <DashboardPage />
    </VaultIQShell>
  );
}
