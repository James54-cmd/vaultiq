import { z } from "zod";

import { createBudgetSchema, updateBudgetSchema, budgetIdSchema } from "@/features/budgets/schemas/budget.schema";

export const createBudgetRpcSchema = createBudgetSchema;

export const updateBudgetRpcSchema = z.object({
  id: budgetIdSchema,
  input: updateBudgetSchema,
});
