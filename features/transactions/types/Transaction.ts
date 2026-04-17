import type { z } from "zod";

import type {
  createManualTransactionFormSchema,
  createManualTransactionSchema,
  gmailSyncSchema,
  transactionCategorySchema,
  transactionDirectionSchema,
  transactionQuerySchema,
  transactionSchema,
  transactionSourceSchema,
  transactionStatusSchema,
} from "@/features/transactions/schemas/transaction.schema";

export type Transaction = z.infer<typeof transactionSchema> & {
  signedAmount: number;
  bankInitials: string;
  kindLabel: string;
  categoryLabel: string;
};

export type TransactionDirection = z.infer<typeof transactionDirectionSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type CreateManualTransactionInput = z.infer<typeof createManualTransactionSchema>;
export type CreateManualTransactionFormInput = z.input<typeof createManualTransactionFormSchema>;
export type GmailSyncInput = z.infer<typeof gmailSyncSchema>;

export type TransactionListSummary = {
  totalCount: number;
  incomeAmount: number;
  expenseAmount: number;
};

export type TransactionListResponse = {
  transactions: Transaction[];
  summary: TransactionListSummary;
};

export type TransactionOverview = {
  totalBalance: number;
  monthlySpending: number;
  remainingBudget: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetLimit: number;
  categorySpend: Array<{
    name: string;
    value: number;
  }>;
  recentTransactions: Transaction[];
};

export type ParsedGmailTransaction = {
  source: "gmail";
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
  parsedTransactions: ParsedGmailTransaction[];
  skippedMessages: GmailSyncSkippedMessage[];
};

export type GmailSyncResult = {
  query: string;
  daysBack: number;
  pagesFetched: number;
  matchedMessageCount: number;
  parsedMessageCount: number;
  insertedCount: number;
  skippedMessageCount: number;
  skippedMessages: GmailSyncSkippedMessage[];
  transactions: Transaction[];
};
