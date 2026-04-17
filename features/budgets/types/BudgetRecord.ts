export type BudgetRecord = {
  id: string;
  category: string;
  period: "weekly" | "monthly" | "yearly";
  limit_amount: number;
  spent_amount: number;
  currency_code: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "archived";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateBudgetRpcParams = {
  p_category: string;
  p_period: "weekly" | "monthly" | "yearly";
  p_limit_amount: number;
  p_spent_amount?: number;
  p_currency_code?: string;
  p_starts_at: string;
  p_ends_at: string;
  p_status?: "active" | "archived";
  p_notes?: string | null;
};

export type UpdateBudgetRpcParams = {
  p_id: string;
  p_category?: string;
  p_period?: "weekly" | "monthly" | "yearly";
  p_limit_amount?: number;
  p_spent_amount?: number;
  p_currency_code?: string;
  p_starts_at?: string;
  p_ends_at?: string;
  p_status?: "active" | "archived";
  p_notes?: string | null;
};

export type DeleteBudgetRpcParams = {
  p_id: string;
};
