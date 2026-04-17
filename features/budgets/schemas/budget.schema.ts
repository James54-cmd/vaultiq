import { z } from "zod";

import { budgetPeriods, budgetStatuses } from "@/features/budgets/constants/budget.constants";

export const budgetPeriodSchema = z.enum(budgetPeriods);

export const budgetStatusSchema = z.enum(budgetStatuses);

export const budgetIdSchema = z.string().uuid();

const amountSchema = z.number().finite().nonnegative();
const dateStringSchema = z.string().date();
const datetimeStringSchema = z.string().datetime({ offset: true });
const parseNumericInput = (value?: string) =>
  value && value.trim().length > 0 ? Number(value) : Number.NaN;
const trimmedOptionalNoteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));

const budgetBaseSchema = z.object({
  category: z.string().trim().min(1).max(120),
  period: budgetPeriodSchema,
  limitAmount: amountSchema,
  spentAmount: amountSchema.default(0),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency code must be a 3-letter ISO code.")
    .default("PHP"),
  startsAt: dateStringSchema,
  endsAt: dateStringSchema,
  status: budgetStatusSchema.default("active"),
  notes: trimmedOptionalNoteSchema.nullable(),
});

const budgetPersistedSchema = z.object({
  id: budgetIdSchema,
  ...budgetBaseSchema.shape,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
});

const createBudgetObjectSchema = budgetBaseSchema.extend({
  notes: trimmedOptionalNoteSchema.optional(),
});

const updateBudgetObjectSchema = createBudgetObjectSchema.partial();

export const createBudgetFormSchema = z
  .object({
    category: z.string(),
    period: budgetPeriodSchema,
    limitAmount: z.string(),
    spentAmount: z.string().optional(),
    currencyCode: z.string().optional(),
    startsAt: z.string(),
    endsAt: z.string(),
    status: budgetStatusSchema.optional(),
    notes: z.string().nullish(),
  })
  .transform((value) =>
    createBudgetSchema.parse({
      category: value.category,
      period: value.period,
      limitAmount: parseNumericInput(value.limitAmount),
      spentAmount:
        value.spentAmount && value.spentAmount.trim().length > 0
          ? Number(value.spentAmount)
          : undefined,
      currencyCode:
        value.currencyCode && value.currencyCode.trim().length > 0
          ? value.currencyCode
          : undefined,
      startsAt: value.startsAt,
      endsAt: value.endsAt,
      status: value.status,
      notes: value.notes,
    })
  );

export const budgetSchema = budgetPersistedSchema.superRefine((value, context) => {
  if (value.startsAt > value.endsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "Budget end date must be on or after the start date.",
    });
  }
});

export const createBudgetSchema = createBudgetObjectSchema
  .superRefine((value, context) => {
    if (value.startsAt > value.endsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Budget end date must be on or after the start date.",
      });
    }
  });

export const updateBudgetSchema = updateBudgetObjectSchema
  .superRefine((value, context) => {
    if (value.startsAt && value.endsAt && value.startsAt > value.endsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Budget end date must be on or after the start date.",
      });
    }
  });

export const budgetQuerySchema = z.object({
  period: budgetPeriodSchema.optional(),
  status: budgetStatusSchema.optional(),
  category: z.string().trim().min(1).optional(),
});
