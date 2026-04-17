import { Goal } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { goals } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export function GoalsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Goals"
        title="Turn balances into milestones"
        description="Keep long-term objectives visible against live balances so savings decisions stay connected to outcomes."
        action={<Button>Create Goal</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {goals.map((goal) => {
          const progress = (goal.saved / goal.target) * 100;
          return (
            <Card key={goal.name}>
              <CardContent className="space-y-4 px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-secondary">
                    <Goal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{goal.name}</p>
                    <p className="text-sm text-muted">Financial target</p>
                  </div>
                </div>
                <p className="financial-figure text-xl font-semibold text-foreground">
                  {formatCurrency(goal.saved)} / {formatCurrency(goal.target)}
                </p>
                <div className="h-2 rounded-full bg-accent-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-sm text-primary">{progress.toFixed(2)}% funded</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EmptyState
        title="Automate goal contributions next"
        description="Wire recurring transfers per institution to move VaultIQ from passive tracking into active planning."
        action="Set Contribution Rules"
      />
    </div>
  );
}
