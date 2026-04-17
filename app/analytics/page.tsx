import { AnalyticsPage } from "@/components/pages/analytics-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <AnalyticsPage />
    </VaultIQShell>
  );
}
