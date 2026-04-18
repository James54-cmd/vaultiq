import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay, startOfMonth, startOfYear } from "date-fns";

import {
  createManualTransactionSchema,
  transactionIdSchema,
  transactionOverviewQuerySchema,
  transactionQuerySchema,
  updateTransactionEditableFieldsSchema,
} from "@/features/transactions/schemas/transaction.schema";
import type {
  GmailSyncResult,
  ParsedGmailTransaction,
  TransactionListResponse,
  TransactionOverview,
  TransactionOverviewPeriod,
} from "@/features/transactions/types/Transaction";
import type {
  CreateManualTransactionRpcParams,
  IngestGmailTransactionRpcParams,
  TransactionRecord,
} from "@/features/transactions/types/TransactionRecord";
import { mapTransactionRecord } from "@/features/transactions/utils/mapTransactionRecord";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { fetchParsedGmailTransactions } from "@/features/transactions/services/gmail-sync.service";

const gmailSyncInsertBatchSize = 10;

type TransactionFinancialSummaryRow = {
  direction: string | null;
  amount: number | string | null;
  status: string | null;
  category?: string | null;
};

export async function listTransactions(
  supabase: SupabaseClient,
  query?: unknown
): Promise<TransactionListResponse> {
  const parsedQuery = transactionQuerySchema.parse(query ?? {});
  const rangeFrom = (parsedQuery.page - 1) * parsedQuery.pageSize;
  const rangeTo = rangeFrom + parsedQuery.pageSize - 1;

  let pagedTransactionQuery = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("happened_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  let summaryQuery = supabase
    .from("transactions")
    .select("direction, amount, status");

  if (parsedQuery.bankName) {
    pagedTransactionQuery = pagedTransactionQuery.eq("bank_name", parsedQuery.bankName);
    summaryQuery = summaryQuery.eq("bank_name", parsedQuery.bankName);
  }

  if (parsedQuery.category) {
    pagedTransactionQuery = pagedTransactionQuery.eq("category", parsedQuery.category);
    summaryQuery = summaryQuery.eq("category", parsedQuery.category);
  }

  if (parsedQuery.direction) {
    pagedTransactionQuery = pagedTransactionQuery.eq("direction", parsedQuery.direction);
    summaryQuery = summaryQuery.eq("direction", parsedQuery.direction);
  }

  if (parsedQuery.status) {
    pagedTransactionQuery = pagedTransactionQuery.eq("status", parsedQuery.status);
    summaryQuery = summaryQuery.eq("status", parsedQuery.status);
  }

  if (parsedQuery.search) {
    const searchFilter =
      `merchant.ilike.%${parsedQuery.search}%,description.ilike.%${parsedQuery.search}%,reference_number.ilike.%${parsedQuery.search}%`;

    pagedTransactionQuery = pagedTransactionQuery.or(searchFilter);
    summaryQuery = summaryQuery.or(searchFilter);
  }

  const [pagedTransactionsResult, summaryResult] = await Promise.all([
    pagedTransactionQuery,
    summaryQuery,
  ]);

  if (pagedTransactionsResult.error) {
    throw new Error(pagedTransactionsResult.error.message);
  }

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  const transactions = ((pagedTransactionsResult.data ?? []) as TransactionRecord[]).map(mapTransactionRecord);
  const summaryRows = (summaryResult.data ?? []) as TransactionFinancialSummaryRow[];
  const settledSummaryRows = summaryRows.filter(shouldIncludeTransactionInFinancialRollups);
  const totalCount = pagedTransactionsResult.count ?? summaryRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / parsedQuery.pageSize));

  return {
    transactions,
    summary: {
      totalCount,
      incomeAmount: Number(
        settledSummaryRows
          .filter((transaction) => transaction.direction === "income")
          .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
          .toFixed(2)
      ),
      expenseAmount: Number(
        settledSummaryRows
          .filter((transaction) => transaction.direction !== "income")
          .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
          .toFixed(2)
      ),
    },
    pagination: {
      page: parsedQuery.page,
      pageSize: parsedQuery.pageSize,
      totalCount,
      totalPages,
      hasNextPage: parsedQuery.page < totalPages,
      hasPreviousPage: parsedQuery.page > 1,
    },
  };
}

export async function createManualTransaction(
  supabase: SupabaseClient,
  input: unknown
) {
  const parsedInput = createManualTransactionSchema.parse(input);

  const rpcPayload: CreateManualTransactionRpcParams = {
    p_direction: parsedInput.direction,
    p_amount: parsedInput.amount,
    p_bank_name: parsedInput.bankName,
    p_merchant: parsedInput.merchant,
    p_description: parsedInput.description,
    p_category: parsedInput.category,
    p_currency_code: parsedInput.currencyCode,
    p_reference_number: parsedInput.referenceNumber ?? null,
    p_notes: parsedInput.notes ?? null,
    p_status: parsedInput.status,
    p_happened_at: new Date(`${parsedInput.happenedAt}T00:00:00+08:00`).toISOString(),
  };

  const { data, error } = await supabase.rpc("create_manual_transaction", rpcPayload);
  if (error) {
    throw new Error(error.message);
  }

  return mapTransactionRecord(data as TransactionRecord);
}

export async function updateTransactionEditableFields(
  supabase: SupabaseClient,
  transactionId: string,
  input: unknown
) {
  const parsedTransactionId = transactionIdSchema.parse(transactionId);
  const parsedInput = updateTransactionEditableFieldsSchema.parse(input);

  const { data, error } = await supabase
    .from("transactions")
    .update({
      merchant: parsedInput.merchant,
      category: parsedInput.category,
      notes: parsedInput.notes,
    })
    .eq("id", parsedTransactionId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Transaction not found.");
  }

  return mapTransactionRecord(data as TransactionRecord);
}

export async function syncGmailTransactions(
  supabase: SupabaseClient,
  userId: string,
  input?: unknown
): Promise<GmailSyncResult> {
  const parsedTransactionsResult = await fetchParsedGmailTransactions(supabase, userId, input);
  const createdTransactions = await ingestGmailTransactionsInBatches(
    supabase,
    parsedTransactionsResult.parsedTransactions
  );
  const updatedCount = parsedTransactionsResult.parsedExistingMessageCount;
  const insertedCount = Math.max(0, createdTransactions.length - updatedCount);

  return {
    query: parsedTransactionsResult.query,
    daysBack: parsedTransactionsResult.daysBack,
    pagesFetched: parsedTransactionsResult.pagesFetched,
    matchedMessageCount: parsedTransactionsResult.matchedMessageCount,
    existingMessageCount: parsedTransactionsResult.existingMessageCount,
    parsedMessageCount: parsedTransactionsResult.parsedTransactions.length,
    insertedCount,
    updatedCount,
    skippedMessageCount: parsedTransactionsResult.skippedMessages.length,
    skippedMessages: parsedTransactionsResult.skippedMessages.slice(0, 5),
    transactions: createdTransactions,
  };
}

export async function getTransactionOverview(
  supabase: SupabaseClient,
  query?: unknown
): Promise<TransactionOverview> {
  const parsedQuery = transactionOverviewQuerySchema.parse(query ?? {});
  const periodStart = getTransactionOverviewStart(parsedQuery.period);
  const budgetPeriod = getTransactionOverviewBudgetPeriod(parsedQuery.period);

  let periodTransactionSummaryQuery = supabase
    .from("transactions")
    .select("direction, amount, category, status");

  let recentTransactionsQuery = supabase
    .from("transactions")
    .select("*")
    .order("happened_at", { ascending: false })
    .limit(10);

  if (periodStart) {
    const periodStartIso = periodStart.toISOString();
    periodTransactionSummaryQuery = periodTransactionSummaryQuery.gte("happened_at", periodStartIso);
    recentTransactionsQuery = recentTransactionsQuery.gte("happened_at", periodStartIso);
  }

  let budgetsQuery = supabase
    .from("budgets")
    .select("limit_amount, spent_amount")
    .eq("status", "active");

  if (budgetPeriod) {
    budgetsQuery = budgetsQuery.eq("period", budgetPeriod);
  }

  const [
    totalBalanceResult,
    periodTransactionSummaryResult,
    recentTransactionsResult,
    budgetsResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("direction, amount, status"),
    periodTransactionSummaryQuery,
    recentTransactionsQuery,
    budgetsQuery,
  ]);

  if (totalBalanceResult.error) {
    throw new Error(totalBalanceResult.error.message);
  }

  if (periodTransactionSummaryResult.error) {
    throw new Error(periodTransactionSummaryResult.error.message);
  }

  if (recentTransactionsResult.error) {
    throw new Error(recentTransactionsResult.error.message);
  }

  if (budgetsResult.error) {
    throw new Error(budgetsResult.error.message);
  }

  const totalBalanceRows = (totalBalanceResult.data ?? []) as TransactionFinancialSummaryRow[];
  const settledBalanceRows = totalBalanceRows.filter(shouldIncludeTransactionInFinancialRollups);
  const periodTransactionSummaryRows =
    (periodTransactionSummaryResult.data ?? []) as TransactionFinancialSummaryRow[];
  const settledPeriodTransactionSummaryRows =
    periodTransactionSummaryRows.filter(shouldIncludeTransactionInFinancialRollups);
  const recentTransactions = ((recentTransactionsResult.data ?? []) as TransactionRecord[]).map(mapTransactionRecord);

  const totalBalance = Number(
    settledBalanceRows
      .reduce((sum, transaction) => {
        const amount = Number(transaction.amount ?? 0);
        return sum + (transaction.direction === "income" ? amount : amount * -1);
      }, 0)
      .toFixed(2)
  );

  const periodIncome = Number(
    settledPeriodTransactionSummaryRows
      .filter((transaction) => transaction.direction === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
      .toFixed(2)
  );

  const periodExpense = Number(
    settledPeriodTransactionSummaryRows
      .filter((transaction) => transaction.direction !== "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
      .toFixed(2)
  );

  const categorySpendMap = new Map<string, number>();
  for (const transaction of settledPeriodTransactionSummaryRows.filter((item) => item.direction !== "income")) {
    const categoryLabel = formatTransactionLabel(transaction.category ?? "other");
    const amount = Number(transaction.amount ?? 0);

    categorySpendMap.set(
      categoryLabel,
      Number(((categorySpendMap.get(categoryLabel) ?? 0) + amount).toFixed(2))
    );
  }

  const budgets = budgetsResult.data ?? [];
  const budgetLimit = Number(
    budgets.reduce((sum, budget) => sum + Number(budget.limit_amount ?? 0), 0).toFixed(2)
  );
  const trackedBudgetSpent = Number(
    budgets.reduce((sum, budget) => sum + Number(budget.spent_amount ?? 0), 0).toFixed(2)
  );

  return {
    period: parsedQuery.period,
    totalBalance,
    periodSpending: periodExpense,
    remainingBudget: Number((budgetLimit - trackedBudgetSpent).toFixed(2)),
    periodIncome,
    periodExpense,
    budgetLimit,
    categorySpend: Array.from(categorySpendMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    recentTransactions,
  };
}

function getTransactionOverviewStart(period: TransactionOverviewPeriod) {
  const now = new Date();

  if (period === "allTime") {
    return null;
  }

  if (period === "daily") {
    return startOfDay(now);
  }

  if (period === "yearly") {
    return startOfYear(now);
  }

  return startOfMonth(now);
}

function getTransactionOverviewBudgetPeriod(period: TransactionOverviewPeriod) {
  if (period === "daily") {
    return "monthly";
  }

  if (period === "allTime") {
    return null;
  }

  return period;
}

function shouldIncludeTransactionInFinancialRollups(
  transaction: Pick<TransactionFinancialSummaryRow, "status">
) {
  return transaction.status !== "pending";
}

async function ingestParsedGmailTransaction(
  supabase: SupabaseClient,
  transaction: ParsedGmailTransaction
) {
  const rpcPayload: IngestGmailTransactionRpcParams = {
    p_direction: transaction.direction,
    p_amount: transaction.amount,
    p_bank_name: transaction.bankName,
    p_merchant: transaction.merchant,
    p_description: transaction.description,
    p_category: transaction.category,
    p_happened_at: transaction.happenedAt,
    p_gmail_message_id: transaction.gmailMessageId,
    p_currency_code: transaction.currencyCode,
    p_reference_number: transaction.referenceNumber,
    p_status: transaction.status,
    p_gmail_thread_id: transaction.gmailThreadId,
    p_raw_payload: transaction.rawPayload,
  };

  const { data, error } = await supabase.rpc("ingest_gmail_transaction", rpcPayload);

  if (error) {
    throw new Error(error.message);
  }

  return mapTransactionRecord(data as TransactionRecord);
}

async function ingestGmailTransactionsInBatches(
  supabase: SupabaseClient,
  transactions: ParsedGmailTransaction[]
) {
  const createdTransactions = [];

  for (let index = 0; index < transactions.length; index += gmailSyncInsertBatchSize) {
    const batch = transactions.slice(index, index + gmailSyncInsertBatchSize);
    const batchResults = await Promise.all(
      batch.map((transaction) => ingestParsedGmailTransaction(supabase, transaction))
    );

    createdTransactions.push(...batchResults);
  }

  return createdTransactions;
}
