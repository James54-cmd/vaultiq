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

export type GmailSyncResult = {
  insertedCount: number;
  transactions: Transaction[];
};
