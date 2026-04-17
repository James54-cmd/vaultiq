import { BUDGET_FIELDS_FRAGMENT } from "@/features/budgets/graphql/budget.fragments";

export const GET_BUDGETS_QUERY = `
  query GetBudgets($period: BudgetPeriod, $status: BudgetStatus, $category: String) {
    budgets(period: $period, status: $status, category: $category) {
      ${BUDGET_FIELDS_FRAGMENT}
    }
    budgetSummary(period: $period, status: $status, category: $category) {
      totalLimitAmount
      totalSpentAmount
      utilizationRate
      budgetCount
    }
  }
`;
