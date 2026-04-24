export type TransactionRecord = {
  id: string;
  source: "manual" | "gmail";
  direction: "income" | "expense" | "transfer";
  amount: number;
  currency_code: string;
  bank_name: string;
  merchant: string;
  description: string;
  category: string;
  reference_number: string | null;
  notes: string | null;
  status: "completed" | "pending" | "flagged";
  happened_at: string;
  created_at: string;
  updated_at: string;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
};

export type GmailTransactionReviewStatus = "pending" | "confirmed" | "declined";

export type GmailTransactionReviewRecord = {
  id: string;
  review_batch_id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  direction: "income" | "expense" | "transfer";
  amount: number;
  currency_code: string;
  bank_name: string;
  merchant: string;
  description: string;
  category: string;
  reference_number: string | null;
  status: "completed" | "pending" | "flagged";
  review_status: GmailTransactionReviewStatus;
  happened_at: string;
  raw_payload: Record<string, unknown>;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
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
