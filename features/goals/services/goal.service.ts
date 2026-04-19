import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSavingsGoalSchema,
  savingsGoalIdSchema,
  updateSavingsGoalSchema,
} from "@/features/goals/schemas/goal.schema";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
  SavingsGoalRecord,
  SavingsGoalSummary,
  UpdateSavingsGoalInput,
} from "@/features/goals/types/Goal";
import { mapSavingsGoalRecord } from "@/features/goals/utils/mapGoalRecord";
import { convertCurrency } from "@/lib/currency";

export function summarizeSavingsGoals(
  goals: SavingsGoal[],
  primaryCurrencyCode: "PHP" | "USD"
): SavingsGoalSummary {
  const activeGoals = goals.filter((goal) => goal.status !== "archived");
  let totalSavedAmount = 0;
  let totalTargetAmount = 0;

  activeGoals.forEach((goal) => {
    totalSavedAmount += convertCurrency(goal.savedAmount, goal.currencyCode, primaryCurrencyCode);
    totalTargetAmount += convertCurrency(goal.targetAmount, goal.currencyCode, primaryCurrencyCode);
  });

  return {
    primaryCurrencyCode,
    totalSavedAmount: Number(totalSavedAmount.toFixed(2)),
    totalTargetAmount: Number(totalTargetAmount.toFixed(2)),
    completedCount: activeGoals.filter((goal) => goal.isCompleted).length,
    goalCount: activeGoals.length,
  };
}

export async function listSavingsGoals(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SavingsGoalRecord[]).map(mapSavingsGoalRecord);
}

export async function createSavingsGoal(
  supabase: SupabaseClient,
  userId: string,
  input: CreateSavingsGoalInput
) {
  const parsedInput = createSavingsGoalSchema.parse(input);

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: parsedInput.name,
      target_amount: parsedInput.targetAmount,
      saved_amount: parsedInput.savedAmount,
      currency_code: parsedInput.currencyCode,
      target_date: parsedInput.targetDate,
      status: parsedInput.status,
      notes: parsedInput.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSavingsGoalRecord(data as SavingsGoalRecord);
}

export async function updateSavingsGoal(
  supabase: SupabaseClient,
  goalId: string,
  input: UpdateSavingsGoalInput
) {
  const parsedGoalId = savingsGoalIdSchema.parse(goalId);
  const parsedInput = updateSavingsGoalSchema.parse(input);
  const nextValues: Record<string, unknown> = {};

  if (parsedInput.name !== undefined) nextValues.name = parsedInput.name;
  if (parsedInput.targetAmount !== undefined) nextValues.target_amount = parsedInput.targetAmount;
  if (parsedInput.savedAmount !== undefined) nextValues.saved_amount = parsedInput.savedAmount;
  if (parsedInput.currencyCode !== undefined) nextValues.currency_code = parsedInput.currencyCode;
  if (parsedInput.targetDate !== undefined) nextValues.target_date = parsedInput.targetDate;
  if (parsedInput.status !== undefined) nextValues.status = parsedInput.status;
  if (parsedInput.notes !== undefined) nextValues.notes = parsedInput.notes;

  const { data, error } = await supabase
    .from("savings_goals")
    .update(nextValues)
    .eq("id", parsedGoalId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapSavingsGoalRecord(data as SavingsGoalRecord);
}

export async function deleteSavingsGoal(supabase: SupabaseClient, goalId: string) {
  const parsedGoalId = savingsGoalIdSchema.parse(goalId);
  const { error, count } = await supabase
    .from("savings_goals")
    .delete({ count: "exact" })
    .eq("id", parsedGoalId);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}
