import { savingsGoalSchema } from "@/features/goals/schemas/goal.schema";
import type { SavingsGoal, SavingsGoalRecord } from "@/features/goals/types/Goal";

export function enrichSavingsGoal(goal: Omit<SavingsGoal, "progressPercent" | "remainingAmount" | "isCompleted">) {
  const remainingAmount = Number(Math.max(goal.targetAmount - goal.savedAmount, 0).toFixed(2));
  const rawProgressPercent = goal.targetAmount === 0 ? 0 : (goal.savedAmount / goal.targetAmount) * 100;

  return savingsGoalSchema.parse({
    ...goal,
    progressPercent: Number(rawProgressPercent.toFixed(2)),
    remainingAmount,
    isCompleted: goal.savedAmount >= goal.targetAmount,
  });
}

export function mapSavingsGoalRecord(record: SavingsGoalRecord) {
  return enrichSavingsGoal({
    id: record.id,
    name: record.name,
    targetAmount: Number(record.target_amount),
    savedAmount: Number(record.saved_amount),
    currencyCode: record.currency_code as SavingsGoal["currencyCode"],
    targetDate: record.target_date,
    status: record.status as SavingsGoal["status"],
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}
