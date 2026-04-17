import "server-only";

import { buildSchema, graphql } from "graphql";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  createManualTransaction,
  getTransactionOverview,
  listTransactions,
  syncGmailTransactions,
} from "@/features/transactions/services/transaction.service";
import { getSupabaseSessionServerClient } from "@/lib/supabase/server";

const transactionGraphqlSchema = buildSchema(`
  enum TransactionSource {
    manual
    gmail
  }

  enum TransactionDirection {
    income
    expense
    transfer
  }

  enum TransactionStatus {
    completed
    pending
    flagged
  }

  enum TransactionOverviewPeriod {
    daily
    monthly
    yearly
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

  enum SupportedBank {
    BDO
    BPI
    UnionBank
    Metrobank
    Security_Bank
    Landbank
    PNB
    EastWest_Bank
    RCBC
    Chinabank
    PSBank
    AUB
    GCash
    Maya
    ShopeePay
    Coins_ph
    Tonik
    GoTyme
    SeaBank
    MariBank
    OwnBank
    CIMB
    ING_Philippines
    Wise
    Payoneer
    Revolut
  }

  type Transaction {
    id: ID!
    source: TransactionSource!
    direction: TransactionDirection!
    amount: Float!
    signedAmount: Float!
    currencyCode: String!
    bankName: String!
    bankInitials: String!
    merchant: String!
    description: String!
    category: TransactionCategory!
    categoryLabel: String!
    referenceNumber: String
    notes: String
    status: TransactionStatus!
    kindLabel: String!
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
    parsedMessageCount: Int!
    insertedCount: Int!
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

  input CreateManualTransactionInput {
    direction: TransactionDirection!
    amount: Float!
    currencyCode: String
    bankName: String!
    merchant: String!
    description: String!
    category: TransactionCategory!
    referenceNumber: String
    notes: String
    status: TransactionStatus
    happenedAt: String!
  }

  input GmailSyncInput {
    query: String
    maxResults: Int
    maxPages: Int
    daysBack: Int
  }

  type Query {
    transactions(
      bankName: String
      category: TransactionCategory
      direction: TransactionDirection
      status: TransactionStatus
      search: String
    ): [Transaction!]!
    transactionOverview(period: TransactionOverviewPeriod): TransactionOverview!
  }

  type Mutation {
    createManualTransaction(input: CreateManualTransactionInput!): Transaction!
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
  createManualTransaction: async ({ input }: { input: Record<string, unknown> }) =>
    createManualTransaction(await getSupabaseSessionServerClient(), input),
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
