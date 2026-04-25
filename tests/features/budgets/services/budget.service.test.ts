import assert from "node:assert/strict";
import { test } from "node:test";

import { computeBudgetMetrics, listBudgets } from "@/features/budgets/services/budget.service";
import type { BudgetRecord } from "@/features/budgets/types/BudgetRecord";
import { mapBudgetRecord } from "@/features/budgets/utils/mapBudgetRecord";

function createBudgetRecord(overrides: Partial<BudgetRecord> = {}): BudgetRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    category: "food",
    period: "monthly",
    limit_amount: 1000,
    spent_amount: 0,
    currency_code: "PHP",
    starts_at: "2026-04-01",
    ends_at: "2026-04-30",
    status: "active",
    alert_threshold_percent: 80,
    notes: null,
    created_at: "2026-04-19T10:00:00.000Z",
    updated_at: "2026-04-19T10:00:00.000Z",
    ...overrides,
  };
}

test("computeBudgetMetrics derives spent, remaining, and alert states from matching transactions", () => {
  const budget = mapBudgetRecord(createBudgetRecord());

  const warningBudget = computeBudgetMetrics(budget, [
    {
      amount: 810,
      currency_code: "PHP",
      category: "food",
      happened_at: "2026-04-11T02:00:00.000Z",
    },
  ]);

  assert.equal(warningBudget.spentAmount, 810);
  assert.equal(warningBudget.remainingAmount, 190);
  assert.equal(warningBudget.utilizationRate, 81);
  assert.equal(warningBudget.alertState, "warning");

  const overBudget = computeBudgetMetrics(budget, [
    {
      amount: 1200,
      currency_code: "PHP",
      category: "food",
      happened_at: "2026-04-15T02:00:00.000Z",
    },
  ]);

  assert.equal(overBudget.remainingAmount, -200);
  assert.equal(overBudget.alertState, "over");
});

test("listBudgets requests confirmed expense rows for spend", async () => {
  const budgetRecord = createBudgetRecord();
  const equalityFilters: Record<string, string> = {};

  const budgetQuery = {
    data: [budgetRecord],
    error: null,
    select() {
      return this;
    },
    order() {
      return this;
    },
    eq() {
      return this;
    },
  };

  const transactionQuery = {
    data: [
      {
        amount: 200,
        currency_code: "PHP",
        category: "food",
        happened_at: "2026-04-10T05:00:00.000Z",
      },
      {
        amount: 100,
        currency_code: "PHP",
        category: "food",
        happened_at: "2026-04-12T05:00:00.000Z",
      },
    ],
    error: null,
    select() {
      return this;
    },
    eq(column: string, value: string) {
      equalityFilters[column] = value;
      return this;
    },
    gte() {
      return this;
    },
    lte() {
      return this;
    },
  };

  const supabase = {
    from(tableName: string) {
      if (tableName === "budgets") {
        return budgetQuery;
      }

      if (tableName === "transactions") {
        return transactionQuery;
      }

      throw new Error(`Unexpected table: ${tableName}`);
    },
  };

  const budgets = await listBudgets(supabase as never, { status: "active" });

  assert.equal(equalityFilters.type, "expense");
  assert.equal(equalityFilters.status, "confirmed");
  assert.equal(budgets[0].spentAmount, 300);
  assert.equal(budgets[0].remainingAmount, 700);
  assert.equal(budgets[0].alertState, "healthy");
});
