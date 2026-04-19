import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createRecurringBillSchema,
  recurringBillIdSchema,
  recurringBillMonthSchema,
  updateRecurringBillSchema,
} from "@/features/bills/schemas/bill.schema";
import type {
  CreateRecurringBillInput,
  RecurringBill,
  RecurringBillRecord,
  RecurringBillSummary,
  UpdateRecurringBillInput,
} from "@/features/bills/types/Bill";
import {
  buildRecurringBillOccurrences,
  getBillMonthRange,
  mapRecurringBillRecord,
} from "@/features/bills/utils/mapBillRecord";
import { convertCurrency } from "@/lib/currency";

export function summarizeRecurringBills(
  bills: RecurringBill[],
  month: string,
  primaryCurrencyCode: "PHP" | "USD",
  today = new Date()
): RecurringBillSummary {
  const { start, end } = getBillMonthRange(month);
  const occurrences = buildRecurringBillOccurrences(bills, start, end, today);

  return {
    month,
    primaryCurrencyCode,
    scheduledCount: occurrences.length,
    dueSoonCount: occurrences.filter((occurrence) => occurrence.isDueSoon).length,
    totalScheduledAmount: Number(
      occurrences
        .reduce(
          (sum, occurrence) => sum + convertCurrency(occurrence.amount, occurrence.currencyCode, primaryCurrencyCode),
          0
        )
        .toFixed(2)
    ),
  };
}

export async function listRecurringBills(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("recurring_bills")
    .select("*")
    .order("anchor_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RecurringBillRecord[]).map(mapRecurringBillRecord);
}

export async function createRecurringBill(
  supabase: SupabaseClient,
  userId: string,
  input: CreateRecurringBillInput
) {
  const parsedInput = createRecurringBillSchema.parse(input);

  const { data, error } = await supabase
    .from("recurring_bills")
    .insert({
      user_id: userId,
      name: parsedInput.name,
      category: parsedInput.category,
      amount: parsedInput.amount,
      currency_code: parsedInput.currencyCode,
      cadence: parsedInput.cadence,
      anchor_date: parsedInput.anchorDate,
      reminder_days_before: parsedInput.reminderDaysBefore,
      autopay: parsedInput.autopay,
      status: parsedInput.status,
      notes: parsedInput.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRecurringBillRecord(data as RecurringBillRecord);
}

export async function updateRecurringBill(
  supabase: SupabaseClient,
  billId: string,
  input: UpdateRecurringBillInput
) {
  const parsedBillId = recurringBillIdSchema.parse(billId);
  const parsedInput = updateRecurringBillSchema.parse(input);
  const nextValues: Record<string, unknown> = {};

  if (parsedInput.name !== undefined) nextValues.name = parsedInput.name;
  if (parsedInput.category !== undefined) nextValues.category = parsedInput.category;
  if (parsedInput.amount !== undefined) nextValues.amount = parsedInput.amount;
  if (parsedInput.currencyCode !== undefined) nextValues.currency_code = parsedInput.currencyCode;
  if (parsedInput.cadence !== undefined) nextValues.cadence = parsedInput.cadence;
  if (parsedInput.anchorDate !== undefined) nextValues.anchor_date = parsedInput.anchorDate;
  if (parsedInput.reminderDaysBefore !== undefined) nextValues.reminder_days_before = parsedInput.reminderDaysBefore;
  if (parsedInput.autopay !== undefined) nextValues.autopay = parsedInput.autopay;
  if (parsedInput.status !== undefined) nextValues.status = parsedInput.status;
  if (parsedInput.notes !== undefined) nextValues.notes = parsedInput.notes;

  const { data, error } = await supabase
    .from("recurring_bills")
    .update(nextValues)
    .eq("id", parsedBillId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapRecurringBillRecord(data as RecurringBillRecord);
}

export async function deleteRecurringBill(supabase: SupabaseClient, billId: string) {
  const parsedBillId = recurringBillIdSchema.parse(billId);
  const { error, count } = await supabase
    .from("recurring_bills")
    .delete({ count: "exact" })
    .eq("id", parsedBillId);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export function parseRecurringBillMonth(month?: string | null) {
  if (!month) {
    const now = new Date();
    return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
  }

  return recurringBillMonthSchema.parse(month);
}
