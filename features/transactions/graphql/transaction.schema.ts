import "server-only";

import { buildSchema, graphql } from "graphql";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  createTransaction,
  getTransactionOverview,
  listTransactions,
  syncGmailTransactions,
} from "@/features/transactions/services/transaction.service";
import { getSupabaseSessionServerClient } from "@/lib/supabase/server";

const transactionGraphqlSchema = buildSchema(`
  enum TransactionSource {
    manual
    gmail
    csv
    bank_import
    system
  }

  enum TransactionType {
    income
    expense
    transfer
    adjustment
    refund
  }

  enum TransactionDirection {
    income
    expense
    transfer
  }

  enum TransactionStatus {
    confirmed
    pending
    declined
    duplicate
    needs_review
  }

  enum TransactionOverviewPeriod {
    daily
    monthly
    yearly
    allTime
  }

  enum TransactionCategory {
    food
    rent
    utilities
    transport
    shopping
    healthcare
    travel
    salary
    freelance
    transfers
    savings
    subscriptions
    education
    entertainment
    uncategorized
  }

  type Transaction {
    id: ID!
    source: TransactionSource!
    sourceId: String
    type: TransactionType!
    direction: TransactionDirection!
    amount: Float!
    signedAmount: Float!
    currencyCode: String!
    accountId: ID
    accountName: String
    fromAccountId: ID
    fromAccountName: String
    toAccountId: ID
    toAccountName: String
    originalTransactionId: ID
    bankName: String!
    bankInitials: String!
    merchantName: String!
    merchant: String!
    description: String!
    category: TransactionCategory!
    categoryLabel: String!
    referenceNumber: String
    notes: String
    status: TransactionStatus!
    kindLabel: String!
    transactionDate: String!
    happenedAt: String!
    createdAt: String!
    updatedAt: String!
    gmailMessageId: String
    gmailThreadId: String
  }

  type TransactionOverviewCategory {
    name: String!
    value: Float!
  }

  type TransactionOverview {
    period: TransactionOverviewPeriod!
    totalBalance: Float!
    periodSpending: Float!
    remainingBudget: Float!
    periodIncome: Float!
    periodExpense: Float!
    budgetLimit: Float!
    categorySpend: [TransactionOverviewCategory!]!
    recentTransactions: [Transaction!]!
  }

  type GmailSyncResult {
    query: String!
    daysBack: Int!
    pagesFetched: Int!
    matchedMessageCount: Int!
    existingMessageCount: Int!
    parsedMessageCount: Int!
    insertedCount: Int!
    updatedCount: Int!
    skippedMessageCount: Int!
    skippedMessages: [GmailSyncSkippedMessage!]!
    transactions: [Transaction!]!
  }

  type GmailSyncSkippedMessage {
    gmailMessageId: String!
    subject: String!
    from: String!
    reason: String!
  }

  input CreateTransactionInput {
    type: TransactionType!
    amount: Float!
    currencyCode: String
    accountId: ID
    fromAccountId: ID
    toAccountId: ID
    originalTransactionId: ID
    merchantName: String!
    description: String
    category: TransactionCategory
    referenceNumber: String
    notes: String
    status: TransactionStatus
    source: TransactionSource
    sourceId: String
    transactionDate: String!
  }

  input GmailSyncInput {
    query: String
    maxResults: Int
    maxPages: Int
    daysBack: Int
    reprocessExisting: Boolean
  }

  type Query {
    transactions(
      bankName: String
      category: TransactionCategory
      type: TransactionType
      direction: TransactionType
      source: TransactionSource
      status: TransactionStatus
      search: String
    ): [Transaction!]!
    transactionOverview(period: TransactionOverviewPeriod): TransactionOverview!
  }

  type Mutation {
    createTransaction(input: CreateTransactionInput!): Transaction!
    createManualTransaction(input: CreateTransactionInput!): Transaction!
    syncGmailTransactions(input: GmailSyncInput): GmailSyncResult!
  }
`);

const rootValue = {
  transactions: async (args: Record<string, unknown>) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return (await listTransactions(supabase, args)).transactions;
  },
  transactionOverview: async (args: Record<string, unknown>) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return getTransactionOverview(supabase, args);
  },
  createTransaction: async ({ input }: { input: Record<string, unknown> }) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return createTransaction(supabase, input);
  },
  createManualTransaction: async ({ input }: { input: Record<string, unknown> }) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return createTransaction(supabase, {
      ...input,
      source: "manual",
    });
  },
  syncGmailTransactions: async ({ input }: { input?: Record<string, unknown> }) => {
    const supabase = await getSupabaseSessionServerClient();
    const user = await requireAuthenticatedUser(supabase);

    return syncGmailTransactions(supabase, user.id, input);
  },
};

export async function executeTransactionGraphqlOperation({
  query,
  variables,
  operationName,
}: {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}) {
  return graphql({
    schema: transactionGraphqlSchema,
    source: query,
    rootValue,
    variableValues: variables,
    operationName,
  });
}
