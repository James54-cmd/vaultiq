"use client";

import { useEffect, useState, useTransition } from "react";

import {
  createSavingsGoalRequest,
  deleteSavingsGoalRequest,
  fetchSavingsGoals,
  updateSavingsGoalRequest,
} from "@/features/goals/services/goal-api.service";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
  SavingsGoalSummary,
  UpdateSavingsGoalInput,
} from "@/features/goals/types/Goal";

export function useGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<SavingsGoalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadGoals = () => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchSavingsGoals();
        setGoals(payload.goals);
        setSummary(payload.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load goals.");
      }
    });
  };

  useEffect(() => {
    reloadGoals();
  }, []);

  const createGoal = async (input: CreateSavingsGoalInput) => {
    await createSavingsGoalRequest(input);
    reloadGoals();
  };

  const updateGoal = async (goalId: string, input: UpdateSavingsGoalInput) => {
    const updatedGoal = await updateSavingsGoalRequest(goalId, input);
    reloadGoals();
    return updatedGoal;
  };

  const deleteGoal = async (goalId: string) => {
    await deleteSavingsGoalRequest(goalId);
    reloadGoals();
  };

  return {
    goals,
    summary,
    error,
    isPending,
    reloadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
