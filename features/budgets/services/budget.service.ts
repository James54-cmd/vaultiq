import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  budgetQuerySchema,
  budgetSchema,
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
import { convertCurrency } from "@/lib/currency";

type BudgetTransactionRow = {
  amount: number | string | null;
  currency_code: string | null;
  category: string | null;
  happened_at: string | null;
};

function normalizeBudgetCategory(value: string) {
  return value.trim().toLowerCase();
}

function toBudgetRangeStartIso(value: string) {
  return new Date(`${value}T00:00:00+08:00`).toISOString();
}

function toBudgetRangeEndIso(value: string) {
  return new Date(`${value}T23:59:59.999+08:00`).toISOString();
}

function toAsiaManilaDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function computeBudgetMetrics(
  budget: Budget,
  transactions: BudgetTransactionRow[]
) {
  const normalizedCategory = normalizeBudgetCategory(budget.category);
  const spentAmount = Number(
    transactions
      .filter((transaction) => {
        if (!transaction.happened_at || !transaction.category) {
          return false;
        }

        const transactionDateKey = toAsiaManilaDateKey(transaction.happened_at);

        return (
          normalizeBudgetCategory(transaction.category) === normalizedCategory &&
          transactionDateKey >= budget.startsAt &&
          transactionDateKey <= budget.endsAt
        );
      })
      .reduce((sum, transaction) => {
        const amount = Number(transaction.amount ?? 0);
        const currencyCode = transaction.currency_code ?? budget.currencyCode;
        return sum + convertCurrency(amount, currencyCode, budget.currencyCode);
      }, 0)
      .toFixed(2)
  );
  const remainingAmount = Number((budget.limitAmount - spentAmount).toFixed(2));
  const utilizationRate =
    budget.limitAmount === 0 ? 0 : Number(((spentAmount / budget.limitAmount) * 100).toFixed(2));
  const alertState =
    budget.limitAmount === 0
      ? "healthy"
      : spentAmount >= budget.limitAmount
        ? "over"
        : utilizationRate >= budget.alertThresholdPercent
          ? "warning"
          : "healthy";

  return budgetSchema.parse({
    ...budget,
    spentAmount,
    remainingAmount,
    utilizationRate,
    alertState,
  });
}

export async function listBudgets(
  supabase: SupabaseClient,
  query?: unknown
): Promise<Budget[]> {
  const parsedQuery = budgetQuerySchema.parse(query ?? {});
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

  const budgets = ((data ?? []) as BudgetRecord[]).map(mapBudgetRecord);

  if (budgets.length === 0) {
    return budgets;
  }

  const startsAtValues = budgets.map((budget) => budget.startsAt).sort();
  const endsAtValues = budgets.map((budget) => budget.endsAt).sort();
  const { data: transactionRows, error: transactionError } = await supabase
    .from("transactions")
    .select("amount, currency_code, category, happened_at")
    .eq("type", "expense")
    .eq("status", "confirmed")
    .gte("happened_at", toBudgetRangeStartIso(startsAtValues[0]))
    .lte("happened_at", toBudgetRangeEndIso(endsAtValues[endsAtValues.length - 1]));

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  return budgets.map((budget) => computeBudgetMetrics(budget, (transactionRows ?? []) as BudgetTransactionRow[]));
}

export async function getBudgetSummary(
  supabase: SupabaseClient,
  query?: unknown
): Promise<BudgetSummary> {
  const budgets = await listBudgets(supabase, query);
  const totalLimitAmount = Number(budgets.reduce((sum, budget) => sum + budget.limitAmount, 0).toFixed(2));
  const totalSpentAmount = Number(budgets.reduce((sum, budget) => sum + budget.spentAmount, 0).toFixed(2));

  return {
    totalLimitAmount,
    totalSpentAmount,
    totalRemainingAmount: Number((totalLimitAmount - totalSpentAmount).toFixed(2)),
    utilizationRate: totalLimitAmount === 0 ? 0 : Number(((totalSpentAmount / totalLimitAmount) * 100).toFixed(2)),
    budgetCount: budgets.length,
  };
}

export async function createBudget(
  supabase: SupabaseClient,
  input: unknown
): Promise<Budget> {
  const parsedInput = createBudgetSchema.parse(input);

  const rpcPayload: CreateBudgetRpcParams = {
    p_category: parsedInput.category,
    p_period: parsedInput.period,
    p_limit_amount: parsedInput.limitAmount,
    p_spent_amount: 0,
    p_currency_code: parsedInput.currencyCode,
    p_starts_at: parsedInput.startsAt,
    p_ends_at: parsedInput.endsAt,
    p_status: parsedInput.status,
    p_alert_threshold_percent: parsedInput.alertThresholdPercent,
    p_notes: parsedInput.notes ?? null,
  };

  const { data, error } = await supabase.rpc("create_budget", rpcPayload);
  if (error) {
    throw new Error(error.message);
  }

  const createdBudget = mapBudgetRecord(data as BudgetRecord);
  return computeBudgetMetrics(createdBudget, []);
}

export async function updateBudget(
  supabase: SupabaseClient,
  id: string,
  input: unknown
): Promise<Budget | null> {
  const parsedInput = updateBudgetSchema.parse(input);

  const rpcPayload: UpdateBudgetRpcParams = {
    p_id: id,
    p_category: parsedInput.category,
    p_period: parsedInput.period,
    p_limit_amount: parsedInput.limitAmount,
    p_currency_code: parsedInput.currencyCode,
    p_starts_at: parsedInput.startsAt,
    p_ends_at: parsedInput.endsAt,
    p_status: parsedInput.status,
    p_alert_threshold_percent: parsedInput.alertThresholdPercent,
    p_notes: parsedInput.notes,
  };

  const { data, error } = await supabase.rpc("update_budget", rpcPayload);
  if (error) {
    if (error.message.toLowerCase().includes("not found")) {
      return null;
    }

    throw new Error(error.message);
  }

  const updatedBudget = mapBudgetRecord(data as BudgetRecord);
  return computeBudgetMetrics(updatedBudget, []);
}

export async function deleteBudget(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
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
