import type { Budget } from "@/features/budgets/types/Budget";

type BudgetSeedRecord = {
  id: string;
  category: string;
  period: "weekly" | "monthly" | "yearly";
  limitAmount: number;
  spentAmount: number;
  currencyCode: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "archived";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function mapBudgetSeed(record: BudgetSeedRecord): Budget {
  const utilizationRate = record.limitAmount === 0 ? 0 : Number(((record.spentAmount / record.limitAmount) * 100).toFixed(2));

  return {
    ...record,
    notes: record.notes ?? null,
    alertThresholdPercent: 80,
    remainingAmount: Number((record.limitAmount - record.spentAmount).toFixed(2)),
    utilizationRate,
    alertState:
      record.limitAmount === 0
        ? "healthy"
        : record.spentAmount >= record.limitAmount
          ? "over"
          : utilizationRate >= 80
            ? "warning"
            : "healthy",
  };
}
