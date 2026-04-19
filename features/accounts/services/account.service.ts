import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createFinancialAccountSchema,
  financialAccountIdSchema,
  updateFinancialAccountSchema,
} from "@/features/accounts/schemas/account.schema";
import type {
  CreateFinancialAccountInput,
  FinancialAccount,
  FinancialAccountRecord,
  FinancialAccountSummary,
  UpdateFinancialAccountInput,
} from "@/features/accounts/types/FinancialAccount";
import { mapFinancialAccountRecord } from "@/features/accounts/utils/mapFinancialAccountRecord";
import { convertCurrency } from "@/lib/currency";

export function summarizeFinancialAccounts(
  accounts: FinancialAccount[],
  primaryCurrencyCode: "PHP" | "USD"
): FinancialAccountSummary {
  const includedAccounts = accounts.filter(
    (account) => account.includeInNetWorth && account.status !== "archived"
  );

  let totalAssets = 0;
  let totalLiabilities = 0;

  includedAccounts.forEach((account) => {
    const convertedBalance = convertCurrency(account.currentBalance, account.currencyCode, primaryCurrencyCode);

    if (account.kind === "asset") {
      totalAssets += convertedBalance;
      return;
    }

    totalLiabilities += convertedBalance;
  });

  totalAssets = Number(totalAssets.toFixed(2));
  totalLiabilities = Number(totalLiabilities.toFixed(2));

  return {
    primaryCurrencyCode,
    totalAssets,
    totalLiabilities,
    totalNetWorth: Number((totalAssets - totalLiabilities).toFixed(2)),
    includedAccountCount: includedAccounts.length,
    groupedTotals: {
      asset: totalAssets,
      liability: totalLiabilities,
    },
  };
}

export async function listFinancialAccounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("financial_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as FinancialAccountRecord[]).map(mapFinancialAccountRecord);
}

export async function createFinancialAccount(
  supabase: SupabaseClient,
  userId: string,
  input: CreateFinancialAccountInput
) {
  const parsedInput = createFinancialAccountSchema.parse(input);

  const { data, error } = await supabase
    .from("financial_accounts")
    .insert({
      user_id: userId,
      name: parsedInput.name,
      institution_name: parsedInput.institutionName,
      account_type: parsedInput.accountType,
      kind: parsedInput.kind,
      source: parsedInput.source,
      currency_code: parsedInput.currencyCode,
      current_balance: parsedInput.currentBalance,
      credit_limit: parsedInput.creditLimit,
      include_in_net_worth: parsedInput.includeInNetWorth,
      status: parsedInput.status,
      last_synced_at: parsedInput.lastSyncedAt,
      notes: parsedInput.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFinancialAccountRecord(data as FinancialAccountRecord);
}

export async function updateFinancialAccount(
  supabase: SupabaseClient,
  accountId: string,
  input: UpdateFinancialAccountInput
) {
  const parsedAccountId = financialAccountIdSchema.parse(accountId);
  const parsedInput = updateFinancialAccountSchema.parse(input);

  const nextValues: Record<string, unknown> = {};

  if (parsedInput.name !== undefined) nextValues.name = parsedInput.name;
  if (parsedInput.institutionName !== undefined) nextValues.institution_name = parsedInput.institutionName;
  if (parsedInput.accountType !== undefined) nextValues.account_type = parsedInput.accountType;
  if (parsedInput.kind !== undefined) nextValues.kind = parsedInput.kind;
  if (parsedInput.source !== undefined) nextValues.source = parsedInput.source;
  if (parsedInput.currencyCode !== undefined) nextValues.currency_code = parsedInput.currencyCode;
  if (parsedInput.currentBalance !== undefined) nextValues.current_balance = parsedInput.currentBalance;
  if (parsedInput.creditLimit !== undefined) nextValues.credit_limit = parsedInput.creditLimit;
  if (parsedInput.includeInNetWorth !== undefined) nextValues.include_in_net_worth = parsedInput.includeInNetWorth;
  if (parsedInput.status !== undefined) nextValues.status = parsedInput.status;
  if (parsedInput.lastSyncedAt !== undefined) nextValues.last_synced_at = parsedInput.lastSyncedAt;
  if (parsedInput.notes !== undefined) nextValues.notes = parsedInput.notes;

  const { data, error } = await supabase
    .from("financial_accounts")
    .update(nextValues)
    .eq("id", parsedAccountId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapFinancialAccountRecord(data as FinancialAccountRecord);
}

export async function deleteFinancialAccount(supabase: SupabaseClient, accountId: string) {
  const parsedAccountId = financialAccountIdSchema.parse(accountId);

  const { error, count } = await supabase
    .from("financial_accounts")
    .delete({ count: "exact" })
    .eq("id", parsedAccountId);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}
