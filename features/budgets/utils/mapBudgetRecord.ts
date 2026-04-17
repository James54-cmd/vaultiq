import { budgetSchema } from "@/features/budgets/schemas/budget.schema";
import type { BudgetRecord } from "@/features/budgets/types/BudgetRecord";

export function mapBudgetRecord(record: BudgetRecord) {
  return budgetSchema.parse({
    id: record.id,
    category: record.category,
    period: record.period,
    limitAmount: Number(record.limit_amount),
    spentAmount: Number(record.spent_amount),
    currencyCode: record.currency_code,
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}
