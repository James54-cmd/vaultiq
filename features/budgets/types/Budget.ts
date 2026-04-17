import type { z } from "zod";

import type {
  budgetQuerySchema,
  budgetSchema,
  createBudgetFormSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "@/features/budgets/schemas/budget.schema";

export type Budget = z.infer<typeof budgetSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateBudgetFormInput = z.input<typeof createBudgetFormSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;

export type BudgetSummary = {
  totalLimitAmount: number;
  totalSpentAmount: number;
  utilizationRate: number;
  budgetCount: number;
};

export type BudgetApiListResponse = {
  budgets: Budget[];
  summary: BudgetSummary;
};
