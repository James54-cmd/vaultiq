"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetModal } from "@/features/budgets/components/BudgetModal";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { formatBudgetLabel } from "@/features/budgets/utils/formatBudgetLabel";
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

export function BudgetsView() {
  const { budgets, summary, period, error, isPending, setPeriod, createBudget, updateBudget, deleteBudget } = useBudgets();
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; category: string } | null>(null);

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Budgets"
        title="Budget guardrails with clear risk signaling"
        description="Weekly, monthly, and yearly budgets surface category burn-rate before overspending becomes a pattern."
        action={
          <div className="flex gap-3">
            <Select
              value={period}
              onValueChange={setPeriod}
            >
              <SelectTrigger className="w-36 bg-transparent">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{formatBudgetLabel("weekly")}</SelectItem>
                <SelectItem value="monthly">{formatBudgetLabel("monthly")}</SelectItem>
                <SelectItem value="yearly">{formatBudgetLabel("yearly")}</SelectItem>
              </SelectContent>
            </Select>
            <BudgetModal onSubmit={createBudget} />
          </div>
        }
      />

      {summary ? (
        <div className="-mx-4 flex gap-4 overflow-x-auto pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
          <div className="min-w-[80vw] max-w-[90vw] flex-shrink-0 md:min-w-0 md:max-w-full">
            <Card>
              <CardContent className="space-y-2 px-6 py-5">
                <p className="text-sm text-muted">Budgeted</p>
                <p className="financial-figure text-xl font-semibold text-foreground">
                  {formatCurrency(summary.totalLimitAmount)}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="min-w-[80vw] max-w-[90vw] flex-shrink-0 md:min-w-0 md:max-w-full">
            <Card>
              <CardContent className="space-y-2 px-6 py-5">
                <p className="text-sm text-muted">Spent</p>
                <p className="financial-figure text-xl font-semibold text-foreground">
                  {formatCurrency(summary.totalSpentAmount)}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="min-w-[80vw] max-w-[90vw] flex-shrink-0 md:min-w-0 md:max-w-full">
            <Card>
              <CardContent className="space-y-2 px-6 py-5">
                <p className="text-sm text-muted">Utilization</p>
                <p className="financial-figure text-xl font-semibold text-foreground">
                  {summary.utilizationRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <ConfirmationModal
        open={budgetToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBudgetToDelete(null);
          }
        }}
        title="Delete Budget"
        description={
          budgetToDelete
            ? `This will permanently remove the ${budgetToDelete.category} budget from VaultIQ.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Budget"
        onConfirm={async () => {
          if (budgetToDelete) {
            await deleteBudget(budgetToDelete.id);
          }
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {isPending && budgets.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))
          : budgets.map((item) => {
              const percent = item.limitAmount === 0 ? 0 : (item.spentAmount / item.limitAmount) * 100;
              return (
                <Card key={item.id}>
                  <CardContent className="space-y-4 px-6 py-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{item.category}</p>
                        <p className="text-sm text-muted">Live category allocation</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getVariant(percent)}>{percent.toFixed(2)}%</Badge>
                        <BudgetModal
                          budget={item}
                          onSubmit={(input) => updateBudget(item.id, input)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3"
                          onClick={() => {
                            setBudgetToDelete({
                              id: item.id,
                              category: item.category,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Spent</span>
                        <span className="financial-figure text-foreground">
                          {formatCurrency(item.spentAmount)} / {formatCurrency(item.limitAmount)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-accent-muted">
                        <div
                          className={`h-3 rounded-full ${getTone(percent)}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
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
