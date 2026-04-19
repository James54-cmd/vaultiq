import { z } from "zod";

import { savingsGoalStatuses } from "@/features/goals/constants/goal.constants";
import { supportedCurrencyCodes } from "@/lib/currency";

export const savingsGoalIdSchema = z.string().uuid();
export const savingsGoalStatusSchema = z.enum(savingsGoalStatuses);
export const savingsGoalCurrencyCodeSchema = z.enum(supportedCurrencyCodes);

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

const savingsGoalBaseSchema = z.object({
  name: trimmedRequiredTextSchema,
  targetAmount: amountSchema,
  savedAmount: amountSchema.default(0),
  currencyCode: savingsGoalCurrencyCodeSchema.default("PHP"),
  targetDate: dateStringSchema.nullable(),
  status: savingsGoalStatusSchema.default("active"),
  notes: trimmedOptionalTextSchema.nullable(),
});

export const savingsGoalSchema = z.object({
  id: savingsGoalIdSchema,
  ...savingsGoalBaseSchema.shape,
  progressPercent: z.number().finite().min(0),
  remainingAmount: z.number().finite().min(0),
  isCompleted: z.boolean(),
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
});

export const createSavingsGoalSchema = savingsGoalBaseSchema.extend({
  notes: trimmedOptionalTextSchema.nullish(),
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export const createSavingsGoalFormSchema = z
  .object({
    name: z.string().trim(),
    targetAmount: z.string().trim(),
    savedAmount: z.string().trim().optional(),
    currencyCode: savingsGoalCurrencyCodeSchema.optional(),
    targetDate: z.string().trim().optional(),
    status: savingsGoalStatusSchema.optional(),
    notes: z.string().trim().nullish(),
  })
  .transform((value) =>
    createSavingsGoalSchema.parse({
      name: value.name,
      targetAmount: parseNumericInput(value.targetAmount),
      savedAmount:
        value.savedAmount && value.savedAmount.trim().length > 0
          ? parseNumericInput(value.savedAmount)
          : undefined,
      currencyCode: value.currencyCode,
      targetDate: value.targetDate && value.targetDate.trim().length > 0 ? value.targetDate : null,
      status: value.status,
      notes: value.notes,
    })
  );
