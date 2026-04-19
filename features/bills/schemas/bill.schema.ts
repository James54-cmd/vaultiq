import { z } from "zod";

import { recurringBillCadences, recurringBillStatuses } from "@/features/bills/constants/bill.constants";
import { supportedCurrencyCodes } from "@/lib/currency";

export const recurringBillIdSchema = z.string().uuid();
export const recurringBillCadenceSchema = z.enum(recurringBillCadences);
export const recurringBillStatusSchema = z.enum(recurringBillStatuses);
export const recurringBillCurrencyCodeSchema = z.enum(supportedCurrencyCodes);

const amountSchema = z.number().finite().nonnegative();
const dateStringSchema = z.string().date();
const datetimeStringSchema = z.string().datetime({ offset: true });
const trimmedRequiredTextSchema = z.string().trim().min(1).max(160);
const trimmedOptionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));

const parseNumericInput = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return Number.NaN;
  }

  const cleaned = value.trim().replace(/,/g, "").replace(/[^0-9.-]+/g, "");
  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

export const recurringBillMonthSchema = z.string().regex(/^\d{4}-\d{2}$/);

const recurringBillBaseSchema = z.object({
  name: trimmedRequiredTextSchema,
  category: trimmedRequiredTextSchema,
  amount: amountSchema,
  currencyCode: recurringBillCurrencyCodeSchema.default("PHP"),
  cadence: recurringBillCadenceSchema.default("monthly"),
  anchorDate: dateStringSchema,
  reminderDaysBefore: z.number().int().min(0).max(30).default(3),
  autopay: z.boolean().default(false),
  status: recurringBillStatusSchema.default("active"),
  notes: trimmedOptionalTextSchema.nullable(),
});

export const recurringBillSchema = z.object({
  id: recurringBillIdSchema,
  ...recurringBillBaseSchema.shape,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
});

export const recurringBillOccurrenceSchema = z.object({
  id: z.string().min(1),
  billId: recurringBillIdSchema,
  name: trimmedRequiredTextSchema,
  category: trimmedRequiredTextSchema,
  amount: amountSchema,
  currencyCode: recurringBillCurrencyCodeSchema,
  dueDate: dateStringSchema,
  reminderDate: dateStringSchema,
  autopay: z.boolean(),
  status: recurringBillStatusSchema,
  isDueSoon: z.boolean(),
});

export const createRecurringBillSchema = recurringBillBaseSchema.extend({
  notes: trimmedOptionalTextSchema.nullish(),
});

export const updateRecurringBillSchema = createRecurringBillSchema.partial();

export const createRecurringBillFormSchema = z
  .object({
    name: z.string().trim(),
    category: z.string().trim(),
    amount: z.string().trim(),
    currencyCode: recurringBillCurrencyCodeSchema.optional(),
    cadence: recurringBillCadenceSchema.optional(),
    anchorDate: z.string().trim(),
    reminderDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
    autopay: z.boolean().optional(),
    status: recurringBillStatusSchema.optional(),
    notes: z.string().trim().nullish(),
  })
  .transform((value) =>
    createRecurringBillSchema.parse({
      name: value.name,
      category: value.category,
      amount: parseNumericInput(value.amount),
      currencyCode: value.currencyCode,
      cadence: value.cadence,
      anchorDate: value.anchorDate,
      reminderDaysBefore: value.reminderDaysBefore,
      autopay: value.autopay ?? false,
      status: value.status,
      notes: value.notes,
    })
  );
