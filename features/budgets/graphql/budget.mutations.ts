import { BUDGET_FIELDS_FRAGMENT } from "@/features/budgets/graphql/budget.fragments";

export const CREATE_BUDGET_MUTATION = `
  mutation CreateBudget($input: CreateBudgetInput!) {
    createBudget(input: $input) {
      ${BUDGET_FIELDS_FRAGMENT}
    }
  }
`;

export const UPDATE_BUDGET_MUTATION = `
  mutation UpdateBudget($id: ID!, $input: UpdateBudgetInput!) {
    updateBudget(id: $id, input: $input) {
      ${BUDGET_FIELDS_FRAGMENT}
    }
  }
`;
