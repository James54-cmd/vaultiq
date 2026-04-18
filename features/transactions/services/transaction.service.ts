import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay, startOfMonth, startOfYear } from "date-fns";

import {
  createManualTransactionSchema,
  transactionOverviewQuerySchema,
  transactionQuerySchema,
} from "@/features/transactions/schemas/transaction.schema";
import type {
  GmailSyncResult,
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
import { fetchParsedGmailTransactions } from "@/features/transactions/services/gmail-sync.service";

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
    .select("direction, amount")
    .order("happened_at", { ascending: false });

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
  const summaryRows = summaryResult.data ?? [];
  const totalCount = pagedTransactionsResult.count ?? summaryRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / parsedQuery.pageSize));

  return {
    transactions,
    summary: {
      totalCount,
      incomeAmount: Number(
        summaryRows
          .filter((transaction) => transaction.direction === "income")
          .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
          .toFixed(2)
      ),
      expenseAmount: Number(
        summaryRows
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

export async function syncGmailTransactions(
  supabase: SupabaseClient,
  userId: string,
  input?: unknown
): Promise<GmailSyncResult> {
  const parsedTransactionsResult = await fetchParsedGmailTransactions(supabase, userId, input);
  const createdTransactions = [];

  for (const transaction of parsedTransactionsResult.parsedTransactions) {
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

    createdTransactions.push(mapTransactionRecord(data as TransactionRecord));
  }

  return {
    query: parsedTransactionsResult.query,
    daysBack: parsedTransactionsResult.daysBack,
    pagesFetched: parsedTransactionsResult.pagesFetched,
    matchedMessageCount: parsedTransactionsResult.matchedMessageCount,
    parsedMessageCount: parsedTransactionsResult.parsedTransactions.length,
    insertedCount: createdTransactions.length,
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

  let periodTransactionsQuery = supabase
    .from("transactions")
    .select("*")
    .order("happened_at", { ascending: false });

  if (periodStart) {
    periodTransactionsQuery = periodTransactionsQuery.gte("happened_at", periodStart.toISOString());
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
    periodTransactionsResult,
    budgetsResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("direction, amount"),
    periodTransactionsQuery,
    budgetsQuery,
  ]);

  if (totalBalanceResult.error) {
    throw new Error(totalBalanceResult.error.message);
  }

  if (periodTransactionsResult.error) {
    throw new Error(periodTransactionsResult.error.message);
  }

  if (budgetsResult.error) {
    throw new Error(budgetsResult.error.message);
  }

  const totalBalanceRows = totalBalanceResult.data ?? [];
  const periodTransactions = ((periodTransactionsResult.data ?? []) as TransactionRecord[]).map(mapTransactionRecord);
  const recentTransactions = periodTransactions.slice(0, 10);

  const totalBalance = Number(
    totalBalanceRows
      .reduce((sum, transaction) => {
        const amount = Number(transaction.amount ?? 0);
        return sum + (transaction.direction === "income" ? amount : amount * -1);
      }, 0)
      .toFixed(2)
  );

  const periodIncome = Number(
    periodTransactions
      .filter((transaction) => transaction.direction === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      .toFixed(2)
  );

  const periodExpense = Number(
    periodTransactions
      .filter((transaction) => transaction.direction !== "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      .toFixed(2)
  );

  const categorySpendMap = new Map<string, number>();
  for (const transaction of periodTransactions.filter((item) => item.direction !== "income")) {
    categorySpendMap.set(
      transaction.categoryLabel,
      Number(((categorySpendMap.get(transaction.categoryLabel) ?? 0) + transaction.amount).toFixed(2))
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
