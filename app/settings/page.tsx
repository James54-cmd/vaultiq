import { SettingsPage } from "@/components/pages/settings-page";
import { VaultIQShell } from "@/components/vaultiq-shell";

export default function Page() {
  return (
    <VaultIQShell>
      <SettingsPage />
    </VaultIQShell>
  );
}
