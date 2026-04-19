import type { z } from "zod";

import type {
  createSavingsGoalFormSchema,
  createSavingsGoalSchema,
  savingsGoalSchema,
  updateSavingsGoalSchema,
} from "@/features/goals/schemas/goal.schema";

export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type CreateSavingsGoalFormInput = z.input<typeof createSavingsGoalFormSchema>;

export type SavingsGoalSummary = {
  primaryCurrencyCode: "PHP" | "USD";
  totalSavedAmount: number;
  totalTargetAmount: number;
  completedCount: number;
  goalCount: number;
};

export type SavingsGoalApiListResponse = {
  goals: SavingsGoal[];
  summary: SavingsGoalSummary;
};

export type SavingsGoalRecord = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  currency_code: string;
  target_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
