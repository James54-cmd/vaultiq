import { z } from "zod";

import { budgetPeriods, budgetStatuses } from "@/features/budgets/constants/budget.constants";

export const budgetPeriodSchema = z.enum(budgetPeriods);
export const budgetStatusSchema = z.enum(budgetStatuses);
export const budgetAlertStateSchema = z.enum(["healthy", "warning", "over"]);
export const budgetIdSchema = z.string().uuid();

const amountSchema = z.number().finite().nonnegative();
const dateStringSchema = z.string().date();
const datetimeStringSchema = z.string().datetime({ offset: true });
const thresholdPercentSchema = z.number().finite().min(0).max(100);
const parseNumericInput = (value?: string) => {
  if (!value || value.trim().length === 0) {
    return Number.NaN;
  }

  const cleaned = value.trim().replace(/,/g, "").replace(/[^0-9.-]+/g, "");
  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const trimmedOptionalNoteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));

const budgetBaseInputSchema = z.object({
  category: z.string().trim().min(1).max(120),
  period: budgetPeriodSchema,
  limitAmount: amountSchema,
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency code must be a 3-letter ISO code.")
    .default("PHP"),
  startsAt: dateStringSchema,
  endsAt: dateStringSchema,
  status: budgetStatusSchema.default("active"),
  alertThresholdPercent: thresholdPercentSchema.default(80),
  notes: trimmedOptionalNoteSchema.nullable(),
});

export const budgetSchema = z.object({
  id: budgetIdSchema,
  ...budgetBaseInputSchema.shape,
  spentAmount: amountSchema,
  remainingAmount: z.number().finite(),
  utilizationRate: z.number().finite().min(0),
  alertState: budgetAlertStateSchema,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
}).superRefine((value, context) => {
  if (value.startsAt > value.endsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "Budget end date must be on or after the start date.",
    });
  }
});

const createBudgetObjectSchema = budgetBaseInputSchema.extend({
  notes: trimmedOptionalNoteSchema.nullish(),
});

const updateBudgetObjectSchema = createBudgetObjectSchema.partial();

export const createBudgetSchema = createBudgetObjectSchema.superRefine((value, context) => {
  if (value.startsAt > value.endsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "Budget end date must be on or after the start date.",
    });
  }
});

export const updateBudgetSchema = updateBudgetObjectSchema.superRefine((value, context) => {
  if (value.startsAt && value.endsAt && value.startsAt > value.endsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "Budget end date must be on or after the start date.",
    });
  }
});

export const createBudgetFormSchema = z
  .object({
    category: z.string(),
    period: budgetPeriodSchema,
    limitAmount: z.string(),
    currencyCode: z.string().optional(),
    startsAt: z.string(),
    endsAt: z.string(),
    status: budgetStatusSchema.optional(),
    alertThresholdPercent: z.string().optional(),
    notes: z.string().nullish(),
  })
  .transform((value) =>
    createBudgetSchema.parse({
      category: value.category,
      period: value.period,
      limitAmount: parseNumericInput(value.limitAmount),
      currencyCode:
        value.currencyCode && value.currencyCode.trim().length > 0
          ? value.currencyCode
          : undefined,
      startsAt: value.startsAt,
      endsAt: value.endsAt,
      status: value.status,
      alertThresholdPercent:
        value.alertThresholdPercent && value.alertThresholdPercent.trim().length > 0
          ? parseNumericInput(value.alertThresholdPercent)
          : undefined,
      notes: value.notes,
    })
  );

export const budgetQuerySchema = z.object({
  period: budgetPeriodSchema.optional(),
  status: budgetStatusSchema.optional(),
  category: z.string().trim().min(1).optional(),
});
