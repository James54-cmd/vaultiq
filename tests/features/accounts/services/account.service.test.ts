import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeFinancialAccounts } from "@/features/accounts/services/account.service";
import type { FinancialAccount } from "@/features/accounts/types/FinancialAccount";

function createFinancialAccount(overrides: Partial<FinancialAccount> = {}): FinancialAccount {
  return {
    id: "99999999-9999-4999-8999-999999999999",
    name: "BPI Savings",
    institutionName: "BPI",
    accountType: "savings",
    kind: "asset",
    source: "manual",
    currencyCode: "PHP",
    currentBalance: 250000,
    creditLimit: null,
    includeInNetWorth: true,
    status: "active",
    lastSyncedAt: null,
    notes: null,
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
    ...overrides,
  };
}

test("summarizeFinancialAccounts totals assets and liabilities in the primary currency", () => {
  const summary = summarizeFinancialAccounts(
    [
      createFinancialAccount(),
      createFinancialAccount({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "USD Brokerage",
        accountType: "investment",
        currencyCode: "USD",
        currentBalance: 1000,
      }),
      createFinancialAccount({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Credit Card",
        accountType: "credit_card",
        kind: "liability",
        currentBalance: 50000,
      }),
      createFinancialAccount({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        name: "Archived Wallet",
        includeInNetWorth: false,
        currentBalance: 12000,
      }),
    ],
    "PHP"
  );

  assert.equal(summary.totalAssets, 306000);
  assert.equal(summary.totalLiabilities, 50000);
  assert.equal(summary.totalNetWorth, 256000);
  assert.equal(summary.includedAccountCount, 3);
});
