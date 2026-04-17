"use client";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
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
  const { budgets, summary, period, error, isPending, setPeriod, createBudget } = useBudgets();

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
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <BudgetModal onCreate={createBudget} />
          </div>
        }
      />

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Budgeted</p>
              <p className="financial-figure text-xl font-semibold text-foreground">
                {formatCurrency(summary.totalLimitAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Spent</p>
              <p className="financial-figure text-xl font-semibold text-foreground">
                {formatCurrency(summary.totalSpentAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Utilization</p>
              <p className="financial-figure text-xl font-semibold text-foreground">
                {summary.utilizationRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

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
                      <Badge variant={getVariant(percent)}>{percent.toFixed(2)}%</Badge>
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
