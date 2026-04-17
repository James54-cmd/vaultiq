import { Plus } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { budgetItems } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

function getTone(percent: number) {
  if (percent < 70) return "bg-primary";
  if (percent <= 90) return "bg-warning";
  return "bg-error";
}

function getVariant(percent: number): "success" | "warning" | "error" {
  if (percent < 70) return "success";
  if (percent <= 90) return "warning";
  return "error";
}

export function BudgetsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Budgets"
        title="Budget guardrails with clear risk signaling"
        description="Weekly, monthly, and yearly budgets surface category burn-rate before overspending becomes a pattern."
        action={
          <div className="flex gap-3">
            <Button variant="secondary">Monthly</Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {budgetItems.map((item) => {
          const percent = (item.spent / item.limit) * 100;
          return (
            <Card key={item.category}>
              <CardContent className="space-y-4 px-6 py-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.category}</p>
                    <p className="text-sm text-muted">Live category allocation</p>
                  </div>
                  <Badge variant={getVariant(percent)}>{percent.toFixed(2)}%</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Spent</span>
                    <span className="financial-figure text-foreground">
                      {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-accent-muted">
                    <div className={`h-3 rounded-full ${getTone(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
