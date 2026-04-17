import { ShieldCheck, Bell, Landmark, WalletCards } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const settingGroups = [
  {
    icon: ShieldCheck,
    title: "Security Controls",
    description: "2FA, device approvals, and encrypted bank connection preferences.",
    status: "Active",
  },
  {
    icon: Bell,
    title: "Alerts & Thresholds",
    description: "Net worth shifts, failed syncs, unusual spending, and low balance alerts.",
    status: "Configured",
  },
  {
    icon: Landmark,
    title: "Institution Defaults",
    description: "Preferred currencies, sync windows, and supported PH bank routing.",
    status: "21 Banks",
  },
  {
    icon: WalletCards,
    title: "Display Preferences",
    description: "Primary currency, chart density, table columns, and dashboard modules.",
    status: "Custom",
  },
];

export function SettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Settings"
        title="Control how VaultIQ ingests, protects, and presents data"
        description="Operational settings for sync behavior, alerts, security, and default financial views."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {settingGroups.map((group) => (
          <Card key={group.title}>
            <CardContent className="space-y-4 px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-accent-muted text-secondary">
                    <group.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{group.title}</p>
                    <p className="text-sm text-muted">{group.description}</p>
                  </div>
                </div>
                <Badge variant="info">{group.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
