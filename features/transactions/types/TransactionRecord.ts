export type TransactionRecord = {
  id: string;
  user_id?: string;
  source: "manual" | "gmail" | "csv" | "bank_import" | "system";
  source_id?: string | null;
  source_metadata?: Record<string, unknown> | null;
  type?: "income" | "expense" | "transfer" | "adjustment" | "refund";
  direction: "income" | "expense" | "transfer";
  amount: number;
  currency_code: string;
  account_id?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  original_transaction_id?: string | null;
  bank_name: string;
  merchant_name?: string | null;
  merchant: string;
  description: string;
  category: string;
  reference_number: string | null;
  notes: string | null;
  status: "confirmed" | "pending" | "declined" | "duplicate" | "needs_review" | "completed" | "flagged";
  transaction_date?: string | null;
  happened_at: string;
  created_at: string;
  updated_at: string;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type GmailTransactionReviewStatus = "pending" | "confirmed" | "declined";

export type GmailTransactionReviewRecord = {
  id: string;
  review_batch_id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  type?: "income" | "expense" | "transfer";
  direction: "income" | "expense" | "transfer";
  amount: number;
  currency_code: string;
  bank_name: string;
  merchant: string;
  description: string;
  category: string;
  reference_number: string | null;
  status: "confirmed" | "pending" | "declined" | "duplicate" | "needs_review" | "completed" | "flagged";
  review_status: GmailTransactionReviewStatus;
  happened_at: string;
  raw_payload: Record<string, unknown>;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTransactionRpcParams = {
  p_type: string;
  p_amount: number;
  p_merchant_name: string;
  p_transaction_date: string;
  p_currency_code: string;
  p_bank_name?: string | null;
  p_category: string;
  p_description: string | null;
  p_notes: string | null;
  p_status: string;
  p_source?: string;
  p_source_id?: string | null;
  p_source_metadata?: Record<string, unknown> | null;
  p_account_id?: string | null;
  p_from_account_id?: string | null;
  p_to_account_id?: string | null;
  p_original_transaction_id?: string | null;
  p_reference_number?: string | null;
};

export type UpdateTransactionRpcParams = {
  p_transaction_id: string;
  p_type: string;
  p_amount: number;
  p_merchant_name: string;
  p_transaction_date: string;
  p_currency_code: string;
  p_category: string;
  p_description: string | null;
  p_notes: string | null;
  p_status: string;
  p_account_id?: string | null;
  p_from_account_id?: string | null;
  p_to_account_id?: string | null;
  p_original_transaction_id?: string | null;
  p_reference_number?: string | null;
};

export type CreateManualTransactionRpcParams = {
  p_direction: string;
  p_amount: number;
  p_currency_code: string;
  p_bank_name: string;
  p_merchant: string;
  p_description: string;
  p_category: string;
  p_reference_number: string | null;
  p_notes: string | null;
  p_status: string;
  p_happened_at: string;
};

export type IngestGmailTransactionRpcParams = {
  p_direction: string;
  p_amount: number;
  p_currency_code: string;
  p_bank_name: string;
  p_merchant: string;
  p_description: string;
  p_category: string;
  p_reference_number: string | null;
  p_status: string;
  p_happened_at: string;
  p_gmail_message_id: string;
  p_gmail_thread_id: string | null;
  p_raw_payload: Record<string, unknown>;
};
