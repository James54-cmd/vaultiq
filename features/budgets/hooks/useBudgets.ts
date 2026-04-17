"use client";

import { useEffect, useState, useTransition } from "react";

import { budgetPeriodSchema, createBudgetSchema } from "@/features/budgets/schemas/budget.schema";
import {
  createBudgetRequest,
  deleteBudgetRequest,
  fetchBudgets,
  updateBudgetRequest,
} from "@/features/budgets/services/budget-api.service";
import type {
  Budget,
  BudgetSummary,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/features/budgets/types/Budget";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadBudgets = (selectedPeriod: "weekly" | "monthly" | "yearly") => {
    startTransition(async () => {
      try {
        setError(null);
        const data = await fetchBudgets({ period: selectedPeriod, status: "active" });
        setBudgets(data.budgets);
        setSummary(data.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load budgets.");
      }
    });
  };

  useEffect(() => {
    loadBudgets(period);
  }, [period]);

  const createBudget = async (input: CreateBudgetInput) => {
    const payload = createBudgetSchema.parse(input);
    await createBudgetRequest(payload);
    loadBudgets(period);
  };

  const updateBudget = async (id: string, input: UpdateBudgetInput) => {
    await updateBudgetRequest(id, input);
    loadBudgets(period);
  };

  const deleteBudget = async (id: string) => {
    await deleteBudgetRequest(id);
    loadBudgets(period);
  };

  return {
    budgets,
    summary,
    period,
    isPending,
    error,
    setPeriod: (value: string) => setPeriod(budgetPeriodSchema.parse(value)),
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
