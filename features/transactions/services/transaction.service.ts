import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay, startOfMonth, startOfYear } from "date-fns";

import {
  createTransactionSchema,
  gmailSyncReviewCommitSchema,
  transactionIdSchema,
  transactionOverviewQuerySchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from "@/features/transactions/schemas/transaction.schema";
import { listBudgets } from "@/features/budgets/services/budget.service";
import type {
  GmailSyncResult,
  GmailSyncReviewCommitResult,
  ParsedGmailTransaction,
  Transaction,
  TransactionListResponse,
  TransactionOverview,
  TransactionOverviewPeriod,
  TransactionStatus,
  TransactionType,
} from "@/features/transactions/types/Transaction";
import type {
  CreateTransactionRpcParams,
  GmailTransactionReviewRecord,
  IngestGmailTransactionRpcParams,
  TransactionRecord,
  UpdateTransactionRpcParams,
} from "@/features/transactions/types/TransactionRecord";
import {
  mapTransactionRecord,
  type TransactionAccountDisplay,
} from "@/features/transactions/utils/mapTransactionRecord";
import { mapGmailTransactionReviewRecord } from "@/features/transactions/utils/mapGmailTransactionReviewRecord";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { fetchParsedGmailTransactions } from "@/features/transactions/services/gmail-sync.service";

const gmailSyncInsertBatchSize = 10;

type TransactionFinancialSummaryRow = {
  id?: string | null;
  type?: string | null;
  direction?: string | null;
  amount: number | string | null;
  status: string | null;
  category?: string | null;
  original_transaction_id?: string | null;
};

type FinancialAccountDisplayRecord = {
  id: string;
  name: string;
  institution_name: string;
};

function normalizeStatus(status: string | null | undefined): TransactionStatus {
  if (status === "completed") return "confirmed";
  if (status === "flagged") return "needs_review";
  if (
    status === "confirmed" ||
    status === "pending" ||
    status === "declined" ||
    status === "duplicate" ||
    status === "needs_review"
  ) {
    return status;
  }

  return "confirmed";
}

function normalizeType(row: Pick<TransactionFinancialSummaryRow, "type" | "direction">): TransactionType {
  if (
    row.type === "income" ||
    row.type === "expense" ||
    row.type === "transfer" ||
    row.type === "adjustment" ||
    row.type === "refund"
  ) {
    return row.type;
  }

  if (row.direction === "income" || row.direction === "expense" || row.direction === "transfer") {
    return row.direction;
  }

  return "expense";
}

function shouldIncludeTransactionInFinancialRollups(
  transaction: Pick<TransactionFinancialSummaryRow, "status">
) {
  return normalizeStatus(transaction.status) === "confirmed";
}

function amountNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function summarizeTransactionRows(rows: TransactionFinancialSummaryRow[]) {
  const confirmedRows = rows.filter(shouldIncludeTransactionInFinancialRollups);
  const expenseRows = confirmedRows.filter((row) => normalizeType(row) === "expense");
  const linkedRefundRows = confirmedRows.filter(
    (row) => normalizeType(row) === "refund" && row.original_transaction_id
  );
  const remainingExpenseById = new Map<string, number>();

  for (const row of expenseRows) {
    if (row.id) {
      remainingExpenseById.set(row.id, amountNumber(row.amount));
    }
  }

  const incomeAmount = Number(
    confirmedRows
      .filter((row) => normalizeType(row) === "income")
      .reduce((sum, row) => sum + amountNumber(row.amount), 0)
      .toFixed(2)
  );
  const grossExpenseAmount = expenseRows.reduce((sum, row) => sum + amountNumber(row.amount), 0);
  const linkedRefundReduction = linkedRefundRows.reduce((sum, row) => {
    const originalTransactionId = row.original_transaction_id;

    if (!originalTransactionId) {
      return sum;
    }

    const remainingOriginalExpense = remainingExpenseById.get(originalTransactionId);

    if (!remainingOriginalExpense) {
      return sum;
    }

    const reduction = Math.min(remainingOriginalExpense, amountNumber(row.amount));
    remainingExpenseById.set(originalTransactionId, Number((remainingOriginalExpense - reduction).toFixed(2)));
    return sum + reduction;
  }, 0);
  const expenseAmount = Number(Math.max(0, grossExpenseAmount - linkedRefundReduction).toFixed(2));
  const totalBalance = Number(
    confirmedRows
      .reduce((sum, row) => {
        const type = normalizeType(row);
        const amount = amountNumber(row.amount);

        if (type === "income" || type === "refund" || type === "adjustment") {
          return sum + amount;
        }

        if (type === "expense") {
          return sum - amount;
        }

        return sum;
      }, 0)
      .toFixed(2)
  );

  return {
    incomeAmount,
    expenseAmount,
    totalBalance,
  };
}

function buildCategorySpend(rows: TransactionFinancialSummaryRow[]) {
  const confirmedRows = rows.filter(shouldIncludeTransactionInFinancialRollups);
  const categorySpendMap = new Map<string, number>();
  const remainingExpenseById = new Map<string, { category: string; remaining: number }>();

  for (const row of confirmedRows) {
    if (normalizeType(row) !== "expense") {
      continue;
    }

    const category = row.category ?? "uncategorized";
    const amount = amountNumber(row.amount);
    const categoryLabel = formatTransactionLabel(category);

    if (row.id) {
      remainingExpenseById.set(row.id, {
        category: categoryLabel,
        remaining: amount,
      });
    }

    categorySpendMap.set(categoryLabel, Number(((categorySpendMap.get(categoryLabel) ?? 0) + amount).toFixed(2)));
  }

  for (const row of confirmedRows) {
    if (normalizeType(row) !== "refund" || !row.original_transaction_id) {
      continue;
    }

    const originalExpense = remainingExpenseById.get(row.original_transaction_id);
    if (!originalExpense) {
      continue;
    }

    const reduction = Math.min(originalExpense.remaining, amountNumber(row.amount));
    originalExpense.remaining = Number((originalExpense.remaining - reduction).toFixed(2));
    categorySpendMap.set(
      originalExpense.category,
      Number(Math.max(0, (categorySpendMap.get(originalExpense.category) ?? 0) - reduction).toFixed(2))
    );
  }

  return Array.from(categorySpendMap.entries())
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
}

function toTransactionDateIso(dateValue: string) {
  return new Date(`${dateValue}T00:00:00+08:00`).toISOString();
}

function transactionToCreateRpcPayload(input: unknown): CreateTransactionRpcParams {
  const parsedInput = createTransactionSchema.parse(input);

  return {
    p_type: parsedInput.type,
    p_amount: parsedInput.amount,
    p_merchant_name: parsedInput.merchantName,
    p_transaction_date: toTransactionDateIso(parsedInput.transactionDate),
    p_currency_code: parsedInput.currencyCode,
    p_category: parsedInput.category,
    p_description: parsedInput.description,
    p_notes: parsedInput.notes,
    p_status: parsedInput.status,
    p_source: parsedInput.source,
    p_source_id: parsedInput.sourceId,
    p_source_metadata: parsedInput.sourceMetadata,
    p_account_id: parsedInput.accountId,
    p_from_account_id: parsedInput.fromAccountId,
    p_to_account_id: parsedInput.toAccountId,
    p_original_transaction_id: parsedInput.originalTransactionId,
    p_reference_number: parsedInput.referenceNumber,
  };
}

function transactionToUpdateRpcPayload(
  transactionId: string,
  input: unknown
): UpdateTransactionRpcParams {
  const parsedInput = updateTransactionSchema.parse(input);

  return {
    p_transaction_id: transactionIdSchema.parse(transactionId),
    p_type: parsedInput.type,
    p_amount: parsedInput.amount,
    p_merchant_name: parsedInput.merchantName,
    p_transaction_date: toTransactionDateIso(parsedInput.transactionDate),
    p_currency_code: parsedInput.currencyCode,
    p_category: parsedInput.category,
    p_description: parsedInput.description,
    p_notes: parsedInput.notes,
    p_status: parsedInput.status,
    p_account_id: parsedInput.accountId,
    p_from_account_id: parsedInput.fromAccountId,
    p_to_account_id: parsedInput.toAccountId,
    p_original_transaction_id: parsedInput.originalTransactionId,
    p_reference_number: parsedInput.referenceNumber,
  };
}

async function getAccountDisplayMap(
  supabase: SupabaseClient,
  records: TransactionRecord[]
) {
  const accountIds = Array.from(
    new Set(
      records.flatMap((record) => [
        record.account_id,
        record.from_account_id,
        record.to_account_id,
      ]).filter((accountId): accountId is string => typeof accountId === "string" && accountId.length > 0)
    )
  );

  if (accountIds.length === 0) {
    return new Map<string, TransactionAccountDisplay>();
  }

  const { data, error } = await supabase
    .from("financial_accounts")
    .select("id, name, institution_name")
    .in("id", accountIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as FinancialAccountDisplayRecord[]).map((account) => [
      account.id,
      {
        id: account.id,
        name: account.name,
        institutionName: account.institution_name,
      },
    ])
  );
}

async function mapTransactionRecords(
  supabase: SupabaseClient,
  records: TransactionRecord[]
) {
  const accountMap = await getAccountDisplayMap(supabase, records);
  return records.map((record) => mapTransactionRecord(record, accountMap));
}

export async function listTransactions(
  supabase: SupabaseClient,
  query?: unknown
): Promise<TransactionListResponse> {
  const parsedQuery = transactionQuerySchema.parse(query ?? {});
  const rangeFrom = (parsedQuery.page - 1) * parsedQuery.pageSize;
  const rangeTo = rangeFrom + parsedQuery.pageSize - 1;
  const typeFilter = parsedQuery.type ?? parsedQuery.direction;

  let pagedTransactionQuery = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("transaction_date", { ascending: false })
    .range(rangeFrom, rangeTo);

  let summaryQuery = supabase
    .from("transactions")
    .select("id, type, direction, amount, status, category, original_transaction_id");

  if (!parsedQuery.status) {
    pagedTransactionQuery = pagedTransactionQuery.not("status", "in", "(declined,duplicate)");
    summaryQuery = summaryQuery.not("status", "in", "(declined,duplicate)");
  }

  if (parsedQuery.bankName) {
    pagedTransactionQuery = pagedTransactionQuery.eq("bank_name", parsedQuery.bankName);
    summaryQuery = summaryQuery.eq("bank_name", parsedQuery.bankName);
  }

  if (parsedQuery.category) {
    pagedTransactionQuery = pagedTransactionQuery.eq("category", parsedQuery.category);
    summaryQuery = summaryQuery.eq("category", parsedQuery.category);
  }

  if (typeFilter) {
    pagedTransactionQuery = pagedTransactionQuery.eq("type", typeFilter);
    summaryQuery = summaryQuery.eq("type", typeFilter);
  }

  if (parsedQuery.source) {
    pagedTransactionQuery = pagedTransactionQuery.eq("source", parsedQuery.source);
    summaryQuery = summaryQuery.eq("source", parsedQuery.source);
  }

  if (parsedQuery.status) {
    pagedTransactionQuery = pagedTransactionQuery.eq("status", parsedQuery.status);
    summaryQuery = summaryQuery.eq("status", parsedQuery.status);
  }

  if (parsedQuery.accountId) {
    const accountFilter =
      `account_id.eq.${parsedQuery.accountId},from_account_id.eq.${parsedQuery.accountId},to_account_id.eq.${parsedQuery.accountId}`;
    pagedTransactionQuery = pagedTransactionQuery.or(accountFilter);
    summaryQuery = summaryQuery.or(accountFilter);
  }

  if (parsedQuery.dateFrom) {
    const startDate = new Date(`${parsedQuery.dateFrom}T00:00:00+08:00`).toISOString();
    pagedTransactionQuery = pagedTransactionQuery.gte("transaction_date", startDate);
    summaryQuery = summaryQuery.gte("transaction_date", startDate);
  }

  if (parsedQuery.dateTo) {
    const endDate = new Date(`${parsedQuery.dateTo}T23:59:59.999+08:00`).toISOString();
    pagedTransactionQuery = pagedTransactionQuery.lte("transaction_date", endDate);
    summaryQuery = summaryQuery.lte("transaction_date", endDate);
  }

  if (parsedQuery.search) {
    const searchFilter =
      `merchant_name.ilike.%${parsedQuery.search}%,merchant.ilike.%${parsedQuery.search}%,description.ilike.%${parsedQuery.search}%,reference_number.ilike.%${parsedQuery.search}%,source_id.ilike.%${parsedQuery.search}%`;

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

  const transactionRecords = (pagedTransactionsResult.data ?? []) as TransactionRecord[];
  const transactions = await mapTransactionRecords(supabase, transactionRecords);
  const summaryRows = (summaryResult.data ?? []) as TransactionFinancialSummaryRow[];
  const summary = summarizeTransactionRows(summaryRows);
  const totalCount = pagedTransactionsResult.count ?? summaryRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / parsedQuery.pageSize));

  return {
    transactions,
    summary: {
      totalCount,
      incomeAmount: summary.incomeAmount,
      expenseAmount: summary.expenseAmount,
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

export async function getTransactionById(
  supabase: SupabaseClient,
  transactionId: string
) {
  const parsedTransactionId = transactionIdSchema.parse(transactionId);
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parsedTransactionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [transaction] = await mapTransactionRecords(supabase, [data as TransactionRecord]);
  return transaction;
}

export async function createTransaction(
  supabase: SupabaseClient,
  input: unknown
) {
  const rpcPayload = transactionToCreateRpcPayload(input);
  const { data, error } = await supabase.rpc("create_transaction", rpcPayload);

  if (error) {
    throw new Error(error.message);
  }

  const [transaction] = await mapTransactionRecords(supabase, [data as TransactionRecord]);
  return transaction;
}

export async function createManualTransaction(
  supabase: SupabaseClient,
  input: unknown
) {
  return createTransaction(supabase, {
    ...(input as Record<string, unknown>),
    source: "manual",
  });
}

export async function updateTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  input: unknown
) {
  const rpcPayload = transactionToUpdateRpcPayload(transactionId, input);
  const { data, error } = await supabase.rpc("update_transaction", rpcPayload);

  if (error) {
    throw new Error(error.message);
  }

  const [transaction] = await mapTransactionRecords(supabase, [data as TransactionRecord]);
  return transaction;
}

export async function updateTransactionEditableFields(
  supabase: SupabaseClient,
  transactionId: string,
  input: unknown
) {
  const parsedTransactionId = transactionIdSchema.parse(transactionId);
  const editableInput = input as {
    merchant?: string;
    merchantName?: string;
    category?: string;
    notes?: string | null;
  };
  const merchantName = (editableInput.merchantName ?? editableInput.merchant)?.trim();
  const category = editableInput.category?.trim();

  if (!merchantName) {
    throw new Error("Merchant name is required.");
  }

  if (!category) {
    throw new Error("Category is required.");
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      merchant_name: merchantName,
      merchant: merchantName,
      category,
      notes: editableInput.notes ?? null,
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

  const [transaction] = await mapTransactionRecords(supabase, [data as TransactionRecord]);
  return transaction;
}

export async function deleteTransaction(
  supabase: SupabaseClient,
  transactionId: string
) {
  const parsedTransactionId = transactionIdSchema.parse(transactionId);
  const { data, error } = await supabase.rpc("delete_transaction", {
    p_transaction_id: parsedTransactionId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
}

export async function syncGmailTransactions(
  supabase: SupabaseClient,
  userId: string,
  input?: unknown
): Promise<GmailSyncResult> {
  const parsedTransactionsResult = await fetchParsedGmailTransactions(supabase, userId, input);
  const existingTransactionMessageIds = await getExistingTransactionMessageIds(
    supabase,
    parsedTransactionsResult.parsedTransactions.map((transaction) => transaction.gmailMessageId)
  );
  const existingParsedTransactions = parsedTransactionsResult.parsedTransactions.filter((transaction) =>
    existingTransactionMessageIds.has(transaction.gmailMessageId)
  );
  const newParsedTransactions = parsedTransactionsResult.parsedTransactions.filter((transaction) =>
    !existingTransactionMessageIds.has(transaction.gmailMessageId)
  );
  const updatedTransactions = await ingestGmailTransactionsInBatches(
    supabase,
    existingParsedTransactions
  );
  const queuedReview = await queueGmailTransactionReviewItems(
    supabase,
    userId,
    newParsedTransactions
  );

  return {
    query: parsedTransactionsResult.query,
    daysBack: parsedTransactionsResult.daysBack,
    pagesFetched: parsedTransactionsResult.pagesFetched,
    matchedMessageCount: parsedTransactionsResult.matchedMessageCount,
    existingMessageCount: parsedTransactionsResult.existingMessageCount,
    parsedMessageCount: parsedTransactionsResult.parsedTransactions.length,
    insertedCount: 0,
    updatedCount: updatedTransactions.length,
    reviewBatchId: queuedReview.reviewBatchId,
    reviewItemCount: queuedReview.reviewItems.length,
    declinedReviewItemCount: queuedReview.declinedReviewItemCount,
    reviewItems: queuedReview.reviewItems,
    skippedMessageCount: parsedTransactionsResult.skippedMessages.length,
    skippedMessages: parsedTransactionsResult.skippedMessages.slice(0, 5),
    transactions: updatedTransactions,
  };
}

export async function commitGmailTransactionReview(
  supabase: SupabaseClient,
  userId: string,
  input: unknown
): Promise<GmailSyncReviewCommitResult> {
  const parsedInput = gmailSyncReviewCommitSchema.parse(input);
  const { data, error } = await supabase
    .from("gmail_transaction_review_items")
    .select("*")
    .eq("user_id", userId)
    .eq("review_batch_id", parsedInput.reviewBatchId)
    .eq("review_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  const reviewRecords = (data ?? []) as GmailTransactionReviewRecord[];
  const selectedIds = new Set(parsedInput.selectedReviewItemIds);
  const missingSelectedIds = parsedInput.selectedReviewItemIds.filter(
    (id) => !reviewRecords.some((record) => record.id === id)
  );

  if (missingSelectedIds.length > 0) {
    throw new Error("One or more review items are no longer available.");
  }

  const confirmedRecords = reviewRecords.filter((record) => selectedIds.has(record.id));
  const declinedRecords = reviewRecords.filter((record) => !selectedIds.has(record.id));
  const transactions = await ingestGmailTransactionsInBatches(
    supabase,
    confirmedRecords.map(mapReviewRecordToParsedTransaction)
  );

  await markReviewItemsConfirmed(
    supabase,
    confirmedRecords,
    transactions.map((transaction) => ({
      id: transaction.id,
      gmailMessageId: transaction.gmailMessageId,
    }))
  );
  await markReviewItemsDeclined(
    supabase,
    declinedRecords.map((record) => record.id)
  );

  return {
    reviewBatchId: parsedInput.reviewBatchId,
    confirmedCount: confirmedRecords.length,
    declinedCount: declinedRecords.length,
    transactions,
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
    .select("id, type, direction, amount, category, status, original_transaction_id");

  let recentTransactionsQuery = supabase
    .from("transactions")
    .select("*")
    .not("status", "in", "(declined,duplicate)")
    .order("transaction_date", { ascending: false })
    .limit(10);

  if (periodStart) {
    const periodStartIso = periodStart.toISOString();
    periodTransactionSummaryQuery = periodTransactionSummaryQuery.gte("transaction_date", periodStartIso);
    recentTransactionsQuery = recentTransactionsQuery.gte("transaction_date", periodStartIso);
  }

  const [
    totalBalanceResult,
    periodTransactionSummaryResult,
    recentTransactionsResult,
    budgets,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, direction, amount, status, original_transaction_id"),
    periodTransactionSummaryQuery,
    recentTransactionsQuery,
    listBudgets(supabase, budgetPeriod ? { period: budgetPeriod, status: "active" } : { status: "active" }),
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

  const totalBalanceRows = (totalBalanceResult.data ?? []) as TransactionFinancialSummaryRow[];
  const periodTransactionSummaryRows =
    (periodTransactionSummaryResult.data ?? []) as TransactionFinancialSummaryRow[];
  const periodSummary = summarizeTransactionRows(periodTransactionSummaryRows);
  const totalSummary = summarizeTransactionRows(totalBalanceRows);
  const recentTransactions = await mapTransactionRecords(
    supabase,
    (recentTransactionsResult.data ?? []) as TransactionRecord[]
  );
  const budgetLimit = Number(
    budgets.reduce((sum, budget) => sum + Number(budget.limitAmount ?? 0), 0).toFixed(2)
  );
  const trackedBudgetSpent = Number(
    budgets.reduce((sum, budget) => sum + Number(budget.spentAmount ?? 0), 0).toFixed(2)
  );

  return {
    period: parsedQuery.period,
    totalBalance: totalSummary.totalBalance,
    periodSpending: periodSummary.expenseAmount,
    remainingBudget: Number((budgetLimit - trackedBudgetSpent).toFixed(2)),
    periodIncome: periodSummary.incomeAmount,
    periodExpense: periodSummary.expenseAmount,
    budgetLimit,
    categorySpend: buildCategorySpend(periodTransactionSummaryRows),
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

async function getExistingTransactionMessageIds(
  supabase: SupabaseClient,
  gmailMessageIds: string[]
) {
  const uniqueMessageIds = Array.from(new Set(gmailMessageIds));
  const existingMessageIds = new Set<string>();

  for (let index = 0; index < uniqueMessageIds.length; index += gmailSyncInsertBatchSize) {
    const batch = uniqueMessageIds.slice(index, index + gmailSyncInsertBatchSize);

    if (batch.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("gmail_message_id")
      .in("gmail_message_id", batch);

    if (error) {
      throw new Error(error.message);
    }

    (data ?? []).forEach((row) => {
      if (typeof row.gmail_message_id === "string" && row.gmail_message_id.length > 0) {
        existingMessageIds.add(row.gmail_message_id);
      }
    });
  }

  return existingMessageIds;
}

async function getExistingReviewRecords(
  supabase: SupabaseClient,
  userId: string,
  gmailMessageIds: string[]
) {
  const uniqueMessageIds = Array.from(new Set(gmailMessageIds));
  const reviewRecords = new Map<string, GmailTransactionReviewRecord>();

  for (let index = 0; index < uniqueMessageIds.length; index += gmailSyncInsertBatchSize) {
    const batch = uniqueMessageIds.slice(index, index + gmailSyncInsertBatchSize);

    if (batch.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from("gmail_transaction_review_items")
      .select("*")
      .eq("user_id", userId)
      .in("gmail_message_id", batch);

    if (error) {
      throw new Error(error.message);
    }

    ((data ?? []) as GmailTransactionReviewRecord[]).forEach((record) => {
      reviewRecords.set(record.gmail_message_id, record);
    });
  }

  return reviewRecords;
}

async function queueGmailTransactionReviewItems(
  supabase: SupabaseClient,
  userId: string,
  transactions: ParsedGmailTransaction[]
) {
  const reviewBatchId = transactions.length > 0 ? randomUUID() : null;
  const existingReviewRecords = await getExistingReviewRecords(
    supabase,
    userId,
    transactions.map((transaction) => transaction.gmailMessageId)
  );
  const pendingTransactions = transactions.filter((transaction) => {
    const existingReviewRecord = existingReviewRecords.get(transaction.gmailMessageId);
    return !existingReviewRecord || existingReviewRecord.review_status === "pending";
  });
  const declinedReviewItemCount = transactions.length - pendingTransactions.length;

  if (!reviewBatchId || pendingTransactions.length === 0) {
    return {
      reviewBatchId: null,
      declinedReviewItemCount,
      reviewItems: [],
    };
  }

  const rows = pendingTransactions.map((transaction) => ({
    review_batch_id: reviewBatchId,
    user_id: userId,
    gmail_message_id: transaction.gmailMessageId,
    gmail_thread_id: transaction.gmailThreadId,
    direction: transaction.direction,
    amount: transaction.amount,
    currency_code: transaction.currencyCode,
    bank_name: transaction.bankName,
    merchant: transaction.merchant,
    description: transaction.description,
    category: transaction.category,
    reference_number: transaction.referenceNumber,
    status: transaction.status,
    review_status: "pending",
    happened_at: transaction.happenedAt,
    raw_payload: transaction.rawPayload,
    transaction_id: null,
  }));

  const { data, error } = await supabase
    .from("gmail_transaction_review_items")
    .upsert(rows, {
      onConflict: "user_id,gmail_message_id",
    })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return {
    reviewBatchId,
    declinedReviewItemCount,
    reviewItems: ((data ?? []) as GmailTransactionReviewRecord[]).map(mapGmailTransactionReviewRecord),
  };
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

  const [mappedTransaction] = await mapTransactionRecords(supabase, [data as TransactionRecord]);
  return mappedTransaction;
}

function mapReviewRecordToParsedTransaction(
  record: GmailTransactionReviewRecord
): ParsedGmailTransaction {
  return {
    source: "gmail",
    type: record.type ?? record.direction,
    direction: record.direction,
    amount: Number(record.amount),
    currencyCode: record.currency_code,
    bankName: record.bank_name as ParsedGmailTransaction["bankName"],
    merchant: record.merchant,
    description: record.description,
    category: record.category as ParsedGmailTransaction["category"],
    referenceNumber: record.reference_number,
    status: normalizeStatus(record.status),
    happenedAt: record.happened_at,
    gmailMessageId: record.gmail_message_id,
    gmailThreadId: record.gmail_thread_id,
    rawPayload: record.raw_payload,
  };
}

async function markReviewItemsConfirmed(
  supabase: SupabaseClient,
  reviewRecords: GmailTransactionReviewRecord[],
  transactions: Array<{ id: string; gmailMessageId: string | null }>
) {
  const transactionIdByMessageId = new Map(
    transactions
      .filter((transaction) => transaction.gmailMessageId)
      .map((transaction) => [transaction.gmailMessageId as string, transaction.id])
  );

  await Promise.all(
    reviewRecords.map((record) => {
      const transactionId = transactionIdByMessageId.get(record.gmail_message_id);

      return supabase
        .from("gmail_transaction_review_items")
        .update({
          review_status: "confirmed",
          transaction_id: transactionId ?? null,
        })
        .eq("id", record.id);
    })
  ).then((results) => {
    const error = results.find((result) => result.error)?.error;

    if (error) {
      throw new Error(error.message);
    }
  });
}

async function markReviewItemsDeclined(
  supabase: SupabaseClient,
  reviewItemIds: string[]
) {
  if (reviewItemIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("gmail_transaction_review_items")
    .update({
      review_status: "declined",
      transaction_id: null,
    })
    .in("id", reviewItemIds);

  if (error) {
    throw new Error(error.message);
  }
}

async function ingestGmailTransactionsInBatches(
  supabase: SupabaseClient,
  transactions: ParsedGmailTransaction[]
) {
  const createdTransactions: Transaction[] = [];

  for (let index = 0; index < transactions.length; index += gmailSyncInsertBatchSize) {
    const batch = transactions.slice(index, index + gmailSyncInsertBatchSize);
    const batchResults = await Promise.all(
      batch.map((transaction) => ingestParsedGmailTransaction(supabase, transaction))
    );

    createdTransactions.push(...batchResults);
  }

  return createdTransactions;
}
