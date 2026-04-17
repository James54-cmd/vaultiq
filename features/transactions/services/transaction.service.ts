import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfMonth } from "date-fns";

import { createManualTransactionSchema, transactionQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import type {
  GmailSyncResult,
  TransactionListResponse,
  TransactionOverview,
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
  let transactionQuery = supabase
    .from("transactions")
    .select("*")
    .order("happened_at", { ascending: false })
    .limit(50);

  if (parsedQuery.bankName) {
    transactionQuery = transactionQuery.eq("bank_name", parsedQuery.bankName);
  }

  if (parsedQuery.category) {
    transactionQuery = transactionQuery.eq("category", parsedQuery.category);
  }

  if (parsedQuery.direction) {
    transactionQuery = transactionQuery.eq("direction", parsedQuery.direction);
  }

  if (parsedQuery.status) {
    transactionQuery = transactionQuery.eq("status", parsedQuery.status);
  }

  if (parsedQuery.search) {
    transactionQuery = transactionQuery.or(
      `merchant.ilike.%${parsedQuery.search}%,description.ilike.%${parsedQuery.search}%,reference_number.ilike.%${parsedQuery.search}%`
    );
  }

  const { data, error } = await transactionQuery;
  if (error) {
    throw new Error(error.message);
  }

  const transactions = ((data ?? []) as TransactionRecord[]).map(mapTransactionRecord);

  return {
    transactions,
    summary: {
      totalCount: transactions.length,
      incomeAmount: Number(
        transactions
          .filter((transaction) => transaction.direction === "income")
          .reduce((sum, transaction) => sum + transaction.amount, 0)
          .toFixed(2)
      ),
      expenseAmount: Number(
        transactions
          .filter((transaction) => transaction.direction !== "income")
          .reduce((sum, transaction) => sum + transaction.amount, 0)
          .toFixed(2)
      ),
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
  supabase: SupabaseClient
): Promise<TransactionOverview> {
  const currentMonthStart = startOfMonth(new Date()).toISOString();

  const [
    transactionsResult,
    monthlyTransactionsResult,
    budgetsResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("happened_at", { ascending: false })
      .limit(10),
    supabase
      .from("transactions")
      .select("*")
      .gte("happened_at", currentMonthStart),
    supabase
      .from("budgets")
      .select("limit_amount, spent_amount")
      .eq("period", "monthly")
      .eq("status", "active"),
  ]);

  if (transactionsResult.error) {
    throw new Error(transactionsResult.error.message);
  }

  if (monthlyTransactionsResult.error) {
    throw new Error(monthlyTransactionsResult.error.message);
  }

  if (budgetsResult.error) {
    throw new Error(budgetsResult.error.message);
  }

  const recentTransactions = ((transactionsResult.data ?? []) as TransactionRecord[]).map(mapTransactionRecord);
  const monthlyTransactions = ((monthlyTransactionsResult.data ?? []) as TransactionRecord[]).map(mapTransactionRecord);

  const totalBalance = Number(
    recentTransactions
      .concat(
        monthlyTransactions.filter(
          (monthlyTransaction) =>
            !recentTransactions.some((recentTransaction) => recentTransaction.id === monthlyTransaction.id)
        )
      )
      .reduce((sum, transaction) => sum + transaction.signedAmount, 0)
      .toFixed(2)
  );

  const monthlyIncome = Number(
    monthlyTransactions
      .filter((transaction) => transaction.direction === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      .toFixed(2)
  );

  const monthlyExpense = Number(
    monthlyTransactions
      .filter((transaction) => transaction.direction !== "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      .toFixed(2)
  );

  const categorySpendMap = new Map<string, number>();
  for (const transaction of monthlyTransactions.filter((item) => item.direction !== "income")) {
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
    totalBalance,
    monthlySpending: monthlyExpense,
    remainingBudget: Number((budgetLimit - trackedBudgetSpent).toFixed(2)),
    monthlyIncome,
    monthlyExpense,
    budgetLimit,
    categorySpend: Array.from(categorySpendMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    recentTransactions,
  };
}
