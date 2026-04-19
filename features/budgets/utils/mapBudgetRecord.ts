import { budgetSchema } from "@/features/budgets/schemas/budget.schema";
import type { BudgetRecord } from "@/features/budgets/types/BudgetRecord";

export function mapBudgetRecord(record: BudgetRecord) {
  const limitAmount = Number(record.limit_amount);
  const spentAmount = Number(record.spent_amount);
  const alertThresholdPercent = Number(record.alert_threshold_percent ?? 80);
  const utilizationRate = limitAmount === 0 ? 0 : Number(((spentAmount / limitAmount) * 100).toFixed(2));

  return budgetSchema.parse({
    id: record.id,
    category: record.category,
    period: record.period,
    limitAmount,
    spentAmount,
    currencyCode: record.currency_code,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    status: record.status,
    alertThresholdPercent,
    notes: record.notes,
    remainingAmount: Number((limitAmount - spentAmount).toFixed(2)),
    utilizationRate,
    alertState:
      limitAmount === 0
        ? "healthy"
        : spentAmount >= limitAmount
          ? "over"
          : utilizationRate >= alertThresholdPercent
            ? "warning"
            : "healthy",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}
