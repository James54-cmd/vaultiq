import type { z } from "zod";

import type {
  createFinancialAccountFormSchema,
  createFinancialAccountSchema,
  financialAccountSchema,
  updateFinancialAccountSchema,
} from "@/features/accounts/schemas/account.schema";

export type FinancialAccount = z.infer<typeof financialAccountSchema>;
export type CreateFinancialAccountInput = z.infer<typeof createFinancialAccountSchema>;
export type UpdateFinancialAccountInput = z.infer<typeof updateFinancialAccountSchema>;
export type CreateFinancialAccountFormInput = z.input<typeof createFinancialAccountFormSchema>;

export type FinancialAccountSummary = {
  primaryCurrencyCode: "PHP" | "USD";
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
  includedAccountCount: number;
  groupedTotals: {
    asset: number;
    liability: number;
  };
};

export type FinancialAccountApiListResponse = {
  accounts: FinancialAccount[];
  summary: FinancialAccountSummary;
};

export type FinancialAccountRecord = {
  id: string;
  user_id: string;
  name: string;
  institution_name: string;
  account_type: string;
  kind: string;
  source: string;
  currency_code: string;
  current_balance: number;
  credit_limit: number | null;
  include_in_net_worth: boolean;
  status: string;
  last_synced_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
