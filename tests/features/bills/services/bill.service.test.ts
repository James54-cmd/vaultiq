import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeRecurringBills } from "@/features/bills/services/bill.service";
import type { RecurringBill } from "@/features/bills/types/Bill";
import { buildRecurringBillOccurrences } from "@/features/bills/utils/mapBillRecord";

function createRecurringBill(overrides: Partial<RecurringBill> = {}): RecurringBill {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Internet",
    category: "utilities",
    amount: 1500,
    currencyCode: "PHP",
    cadence: "monthly",
    anchorDate: "2026-01-15",
    reminderDaysBefore: 3,
    autopay: false,
    status: "active",
    notes: null,
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
    ...overrides,
  };
}

test("buildRecurringBillOccurrences generates monthly, quarterly, and yearly dates across month boundaries", () => {
  const occurrences = buildRecurringBillOccurrences(
    [
      createRecurringBill(),
      createRecurringBill({
        id: "33333333-3333-4333-8333-333333333333",
        name: "Insurance",
        cadence: "quarterly",
        anchorDate: "2026-01-10",
      }),
      createRecurringBill({
        id: "44444444-4444-4444-8444-444444444444",
        name: "Domain",
        cadence: "yearly",
        anchorDate: "2024-04-20",
      }),
    ],
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2026-04-30T23:59:59.999Z"),
    new Date("2026-04-12T00:00:00.000Z")
  );

  assert.deepEqual(
    occurrences.map((occurrence) => [occurrence.name, occurrence.dueDate]),
    [
      ["Insurance", "2026-04-10"],
      ["Internet", "2026-04-15"],
      ["Domain", "2026-04-20"],
    ]
  );
  assert.equal(occurrences.find((occurrence) => occurrence.name === "Internet")?.isDueSoon, true);
});

test("summarizeRecurringBills reports scheduled totals and due-soon counts for a month", () => {
  const summary = summarizeRecurringBills(
    [
      createRecurringBill(),
      createRecurringBill({
        id: "55555555-5555-4555-8555-555555555555",
        name: "Streaming",
        amount: 20,
        currencyCode: "USD",
        anchorDate: "2026-04-18",
        reminderDaysBefore: 2,
      }),
    ],
    "2026-04",
    "PHP",
    new Date("2026-04-16T00:00:00.000Z")
  );

  assert.equal(summary.scheduledCount, 2);
  assert.equal(summary.dueSoonCount, 1);
  assert.equal(summary.totalScheduledAmount, 2620);
});
