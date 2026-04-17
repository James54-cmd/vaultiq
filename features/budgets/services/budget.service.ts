import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  budgetQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "@/features/budgets/schemas/budget.schema";
import type {
  Budget,
  BudgetSummary,
} from "@/features/budgets/types/Budget";
import type {
  BudgetRecord,
  CreateBudgetRpcParams,
  DeleteBudgetRpcParams,
  UpdateBudgetRpcParams,
} from "@/features/budgets/types/BudgetRecord";
import { mapBudgetRecord } from "@/features/budgets/utils/mapBudgetRecord";

export async function listBudgets(query?: unknown): Promise<Budget[]> {
  const parsedQuery = budgetQuerySchema.parse(query ?? {});
  const supabase = getSupabaseServerClient();
  let budgetQuery = supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: false });

  if (parsedQuery.period) {
    budgetQuery = budgetQuery.eq("period", parsedQuery.period);
  }

  if (parsedQuery.status) {
    budgetQuery = budgetQuery.eq("status", parsedQuery.status);
  }

  if (parsedQuery.category) {
    budgetQuery = budgetQuery.eq("category", parsedQuery.category);
  }

  const { data, error } = await budgetQuery;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as BudgetRecord[]).map(mapBudgetRecord);
}

export async function getBudgetSummary(query?: unknown): Promise<BudgetSummary> {
  const budgets = await listBudgets(query);
  const totalLimitAmount = budgets.reduce((sum, budget) => sum + budget.limitAmount, 0);
  const totalSpentAmount = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);

  return {
    totalLimitAmount,
    totalSpentAmount,
    utilizationRate: totalLimitAmount === 0 ? 0 : Number(((totalSpentAmount / totalLimitAmount) * 100).toFixed(2)),
    budgetCount: budgets.length,
  };
}

export async function createBudget(input: unknown): Promise<Budget> {
  const parsedInput = createBudgetSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const rpcPayload: CreateBudgetRpcParams = {
    p_category: parsedInput.category,
    p_period: parsedInput.period,
    p_limit_amount: parsedInput.limitAmount,
    p_spent_amount: parsedInput.spentAmount,
    p_currency_code: parsedInput.currencyCode,
    p_starts_at: parsedInput.startsAt,
    p_ends_at: parsedInput.endsAt,
    p_status: parsedInput.status,
    p_notes: parsedInput.notes ?? null,
  };

  const { data, error } = await supabase.rpc("create_budget", rpcPayload);
  if (error) {
    throw new Error(error.message);
  }

  return mapBudgetRecord(data as BudgetRecord);
}

export async function updateBudget(id: string, input: unknown): Promise<Budget | null> {
  const parsedInput = updateBudgetSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const rpcPayload: UpdateBudgetRpcParams = {
    p_id: id,
    p_category: parsedInput.category,
    p_period: parsedInput.period,
    p_limit_amount: parsedInput.limitAmount,
    p_spent_amount: parsedInput.spentAmount,
    p_currency_code: parsedInput.currencyCode,
    p_starts_at: parsedInput.startsAt,
    p_ends_at: parsedInput.endsAt,
    p_status: parsedInput.status,
    p_notes: parsedInput.notes,
  };

  const { data, error } = await supabase.rpc("update_budget", rpcPayload);
  if (error) {
    if (error.message.toLowerCase().includes("not found")) {
      return null;
    }

    throw new Error(error.message);
  }

  return mapBudgetRecord(data as BudgetRecord);
}

export async function deleteBudget(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  const rpcPayload: DeleteBudgetRpcParams = {
    p_id: id,
  };

  const { data, error } = await supabase.rpc("delete_budget", rpcPayload);
  if (error) {
    if (error.message.toLowerCase().includes("not found")) {
      return false;
    }

    throw new Error(error.message);
  }

  return Boolean(data);
}
