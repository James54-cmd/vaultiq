import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeSavingsGoals } from "@/features/goals/services/goal.service";
import type { SavingsGoalRecord } from "@/features/goals/types/Goal";
import { mapSavingsGoalRecord } from "@/features/goals/utils/mapGoalRecord";

function createSavingsGoalRecord(overrides: Partial<SavingsGoalRecord> = {}): SavingsGoalRecord {
  return {
    id: "66666666-6666-4666-8666-666666666666",
    user_id: "77777777-7777-4777-8777-777777777777",
    name: "Emergency Fund",
    target_amount: 600000,
    saved_amount: 420000,
    currency_code: "PHP",
    target_date: "2026-12-31",
    status: "active",
    notes: null,
    created_at: "2026-04-19T10:00:00.000Z",
    updated_at: "2026-04-19T10:00:00.000Z",
    ...overrides,
  };
}

test("mapSavingsGoalRecord derives progress, remaining amount, and completion state", () => {
  const goal = mapSavingsGoalRecord(createSavingsGoalRecord());

  assert.equal(goal.progressPercent, 70);
  assert.equal(goal.remainingAmount, 180000);
  assert.equal(goal.isCompleted, false);

  const completedGoal = mapSavingsGoalRecord(
    createSavingsGoalRecord({
      saved_amount: 620000,
      target_date: null,
    })
  );

  assert.equal(completedGoal.remainingAmount, 0);
  assert.equal(completedGoal.isCompleted, true);
  assert.equal(completedGoal.targetDate, null);
});

test("summarizeSavingsGoals converts native amounts into the primary currency", () => {
  const summary = summarizeSavingsGoals(
    [
      mapSavingsGoalRecord(createSavingsGoalRecord()),
      mapSavingsGoalRecord(
        createSavingsGoalRecord({
          id: "88888888-8888-4888-8888-888888888888",
          name: "Vacation",
          target_amount: 2500,
          saved_amount: 1000,
          currency_code: "USD",
        })
      ),
    ],
    "PHP"
  );

  assert.equal(summary.totalSavedAmount, 476000);
  assert.equal(summary.totalTargetAmount, 740000);
  assert.equal(summary.completedCount, 0);
  assert.equal(summary.goalCount, 2);
});
