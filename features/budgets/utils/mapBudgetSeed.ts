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
  return {
    ...record,
    notes: record.notes ?? null,
  };
}
