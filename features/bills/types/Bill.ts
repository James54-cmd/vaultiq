import type { z } from "zod";

import type {
  createRecurringBillFormSchema,
  createRecurringBillSchema,
  recurringBillOccurrenceSchema,
  recurringBillSchema,
  updateRecurringBillSchema,
} from "@/features/bills/schemas/bill.schema";

export type RecurringBill = z.infer<typeof recurringBillSchema>;
export type RecurringBillOccurrence = z.infer<typeof recurringBillOccurrenceSchema>;
export type CreateRecurringBillInput = z.infer<typeof createRecurringBillSchema>;
export type UpdateRecurringBillInput = z.infer<typeof updateRecurringBillSchema>;
export type CreateRecurringBillFormInput = z.input<typeof createRecurringBillFormSchema>;

export type RecurringBillSummary = {
  month: string;
  primaryCurrencyCode: "PHP" | "USD";
  scheduledCount: number;
  dueSoonCount: number;
  totalScheduledAmount: number;
};

export type RecurringBillApiListResponse = {
  bills: RecurringBill[];
  occurrences: RecurringBillOccurrence[];
  summary: RecurringBillSummary;
};

export type RecurringBillRecord = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  currency_code: string;
  cadence: string;
  anchor_date: string;
  reminder_days_before: number;
  autopay: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
