import "server-only";

import { buildSchema, graphql } from "graphql";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  createBudget,
  getBudgetSummary,
  listBudgets,
  updateBudget,
} from "@/features/budgets/services/budget.service";
import { getSupabaseSessionServerClient } from "@/lib/supabase/server";

const budgetGraphqlSchema = buildSchema(`
  enum BudgetPeriod {
    weekly
    monthly
    yearly
  }

  enum BudgetStatus {
    active
    archived
  }

  type Budget {
    id: ID!
    category: String!
    period: BudgetPeriod!
    limitAmount: Float!
    spentAmount: Float!
    remainingAmount: Float!
    utilizationRate: Float!
    alertState: String!
    currencyCode: String!
    startsAt: String!
    endsAt: String!
    status: BudgetStatus!
    alertThresholdPercent: Float!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type BudgetSummary {
    totalLimitAmount: Float!
    totalSpentAmount: Float!
    totalRemainingAmount: Float!
    utilizationRate: Float!
    budgetCount: Int!
  }

  input CreateBudgetInput {
    category: String!
    period: BudgetPeriod!
    limitAmount: Float!
    currencyCode: String!
    startsAt: String!
    endsAt: String!
    status: BudgetStatus!
    alertThresholdPercent: Float
    notes: String
  }

  input UpdateBudgetInput {
    category: String
    period: BudgetPeriod
    limitAmount: Float
    currencyCode: String
    startsAt: String
    endsAt: String
    status: BudgetStatus
    alertThresholdPercent: Float
    notes: String
  }

  type Query {
    budgets(period: BudgetPeriod, status: BudgetStatus, category: String): [Budget!]!
    budgetSummary(period: BudgetPeriod, status: BudgetStatus, category: String): BudgetSummary!
  }

  type Mutation {
    createBudget(input: CreateBudgetInput!): Budget!
    updateBudget(id: ID!, input: UpdateBudgetInput!): Budget
  }
`);

const rootValue = {
  budgets: async (args: Record<string, unknown>) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return listBudgets(supabase, args);
  },
  budgetSummary: async (args: Record<string, unknown>) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return getBudgetSummary(supabase, args);
  },
  createBudget: async ({ input }: { input: Record<string, unknown> }) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return createBudget(supabase, input);
  },
  updateBudget: async ({
    id,
    input,
  }: {
    id: string;
    input: Record<string, unknown>;
  }) => {
    const supabase = await getSupabaseSessionServerClient();
    await requireAuthenticatedUser(supabase);

    return updateBudget(supabase, id, input);
  },
};

export async function executeBudgetGraphqlOperation({
  query,
  variables,
  operationName,
}: {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}) {
  return graphql({
    schema: budgetGraphqlSchema,
    source: query,
    rootValue,
    variableValues: variables,
    operationName,
  });
}
