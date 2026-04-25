import type { z } from "zod";

import type {
  gmailSyncReviewCommitSchema,
  createTransactionFormSchema,
  createTransactionSchema,
  createManualTransactionFormSchema,
  createManualTransactionSchema,
  gmailSyncSchema,
  transactionCategorySchema,
  transactionDirectionSchema,
  transactionOverviewPeriodSchema,
  transactionOverviewQuerySchema,
  transactionQuerySchema,
  transactionSchema,
  transactionSourceSchema,
  transactionStatusSchema,
  transactionTypeSchema,
  updateTransactionSchema,
  updateTransactionEditableFieldsSchema,
} from "@/features/transactions/schemas/transaction.schema";

export type Transaction = z.infer<typeof transactionSchema> & {
  signedAmount: number;
  bankInitials: string;
  kindLabel: string;
  categoryLabel: string;
};

export type TransactionDirection = z.infer<typeof transactionDirectionSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type TransactionOverviewPeriod = z.infer<typeof transactionOverviewPeriodSchema>;
export type TransactionOverviewQuery = z.infer<typeof transactionOverviewQuerySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateTransactionFormInput = z.input<typeof createTransactionFormSchema>;
export type CreateManualTransactionInput = z.infer<typeof createManualTransactionSchema>;
export type CreateManualTransactionFormInput = z.input<typeof createManualTransactionFormSchema>;
export type GmailSyncInput = z.infer<typeof gmailSyncSchema>;
export type GmailSyncReviewCommitInput = z.infer<typeof gmailSyncReviewCommitSchema>;
export type UpdateTransactionEditableFieldsInput = z.infer<typeof updateTransactionEditableFieldsSchema>;
export type UpdateTransactionEditableFieldsFormInput = z.input<typeof updateTransactionEditableFieldsSchema>;

export type TransactionListSummary = {
  totalCount: number;
  incomeAmount: number;
  expenseAmount: number;
};

export type TransactionListPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TransactionListResponse = {
  transactions: Transaction[];
  summary: TransactionListSummary;
  pagination: TransactionListPagination;
};

export type TransactionOverview = {
  period: TransactionOverviewPeriod;
  totalBalance: number;
  periodSpending: number;
  remainingBudget: number;
  periodIncome: number;
  periodExpense: number;
  budgetLimit: number;
  categorySpend: Array<{
    name: string;
    value: number;
  }>;
  recentTransactions: Transaction[];
};

export type ParsedGmailTransaction = {
  source: "gmail";
  type: Extract<TransactionType, "income" | "expense" | "transfer">;
  direction: TransactionDirection;
  amount: number;
  currencyCode: string;
  bankName: string;
  merchant: string;
  description: string;
  category: TransactionCategory;
  referenceNumber: string | null;
  status: TransactionStatus;
  happenedAt: string;
  gmailMessageId: string;
  gmailThreadId: string | null;
  rawPayload: Record<string, unknown>;
};

export type GmailSyncSkippedMessage = {
  gmailMessageId: string;
  subject: string;
  from: string;
  reason: string;
};

export type GmailTransactionReviewStatus = "pending" | "confirmed" | "declined";

export type GmailTransactionReviewItem = {
  id: string;
  reviewBatchId: string;
  gmailMessageId: string;
  gmailThreadId: string | null;
  type: Extract<TransactionType, "income" | "expense" | "transfer">;
  direction: TransactionDirection;
  amount: number;
  signedAmount: number;
  currencyCode: string;
  bankName: string;
  bankInitials: string;
  merchant: string;
  description: string;
  category: TransactionCategory;
  categoryLabel: string;
  referenceNumber: string | null;
  status: TransactionStatus;
  reviewStatus: GmailTransactionReviewStatus;
  happenedAt: string;
  rawPayload: Record<string, unknown>;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmailSyncReviewCommitResult = {
  reviewBatchId: string;
  confirmedCount: number;
  declinedCount: number;
  transactions: Transaction[];
};

export type GmailPaymentEmailParseResult =
  | {
      kind: "parsed";
      transaction: ParsedGmailTransaction;
    }
  | {
      kind: "skipped";
      skippedMessage: GmailSyncSkippedMessage;
    };

export type ParsedGmailTransactionsResult = {
  query: string;
  daysBack: number;
  pagesFetched: number;
  matchedMessageCount: number;
  existingMessageCount: number;
  parsedExistingMessageCount: number;
  parsedTransactions: ParsedGmailTransaction[];
  skippedMessages: GmailSyncSkippedMessage[];
};

export type GmailSyncResult = {
  query: string;
  daysBack: number;
  pagesFetched: number;
  matchedMessageCount: number;
  existingMessageCount: number;
  parsedMessageCount: number;
  insertedCount: number;
  updatedCount: number;
  reviewBatchId: string | null;
  reviewItemCount: number;
  declinedReviewItemCount: number;
  reviewItems: GmailTransactionReviewItem[];
  skippedMessageCount: number;
  skippedMessages: GmailSyncSkippedMessage[];
  transactions: Transaction[];
};
