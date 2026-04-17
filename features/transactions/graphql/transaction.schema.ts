import "server-only";

import { buildSchema, graphql } from "graphql";

import {
  createManualTransaction,
  getTransactionOverview,
  listTransactions,
  syncGmailTransactions,
} from "@/features/transactions/services/transaction.service";

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
    totalBalance: Float!
    monthlySpending: Float!
    remainingBudget: Float!
    monthlyIncome: Float!
    monthlyExpense: Float!
    budgetLimit: Float!
    categorySpend: [TransactionOverviewCategory!]!
  }

  type GmailSyncResult {
    insertedCount: Int!
    transactions: [Transaction!]!
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
  }

  type Query {
    transactions(
      bankName: String
      category: TransactionCategory
      direction: TransactionDirection
      status: TransactionStatus
      search: String
    ): [Transaction!]!
    transactionOverview: TransactionOverview!
  }

  type Mutation {
    createManualTransaction(input: CreateManualTransactionInput!): Transaction!
    syncGmailTransactions(input: GmailSyncInput): GmailSyncResult!
  }
`);

const rootValue = {
  transactions: async (args: Record<string, unknown>) => (await listTransactions(args)).transactions,
  transactionOverview: async () => getTransactionOverview(),
  createManualTransaction: async ({ input }: { input: Record<string, unknown> }) =>
    createManualTransaction(input),
  syncGmailTransactions: async ({ input }: { input?: Record<string, unknown> }) =>
    syncGmailTransactions(input),
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
