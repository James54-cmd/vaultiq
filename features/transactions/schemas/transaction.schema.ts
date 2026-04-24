import { z } from "zod";

import {
  supportedBanks,
  transactionCategories,
  transactionDirections,
  transactionOverviewPeriods,
  transactionSources,
  transactionStatuses,
} from "@/features/transactions/constants/transaction.constants";

export const transactionIdSchema = z.string().uuid();
export const transactionDirectionSchema = z.enum(transactionDirections);
export const transactionSourceSchema = z.enum(transactionSources);
export const transactionStatusSchema = z.enum(transactionStatuses);
export const transactionCategorySchema = z.enum(transactionCategories);
export const supportedBankSchema = z.enum(supportedBanks);
export const transactionOverviewPeriodSchema = z.enum(transactionOverviewPeriods);

const amountSchema = z.number().finite().nonnegative();
const dateStringSchema = z.string().date();
const datetimeStringSchema = z.string().datetime({ offset: true });
const parseNumericInput = (value?: string) => {
  if (!value || value.trim().length === 0) return Number.NaN;
  const cleaned = value.trim().replace(/,/g, "").replace(/[^0-9.-]+/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
};

const trimmedRequiredTextSchema = z.string().trim().min(1).max(160);
const trimmedOptionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));
const trimmedOptionalReferenceSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value.length === 0 ? null : value));

const transactionBaseSchema = z.object({
  source: transactionSourceSchema,
  direction: transactionDirectionSchema,
  amount: amountSchema,
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency code must be a 3-letter ISO code.")
    .default("PHP"),
  bankName: supportedBankSchema,
  merchant: trimmedRequiredTextSchema,
  description: trimmedRequiredTextSchema,
  category: transactionCategorySchema,
  referenceNumber: trimmedOptionalReferenceSchema.nullable(),
  notes: trimmedOptionalTextSchema.nullable(),
  status: transactionStatusSchema.default("completed"),
  happenedAt: dateStringSchema,
});

const persistedTransactionSchema = z.object({
  id: transactionIdSchema,
  ...transactionBaseSchema.shape,
  source: transactionSourceSchema,
  happenedAt: datetimeStringSchema,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
  gmailMessageId: z.string().trim().min(1).nullable(),
  gmailThreadId: z.string().trim().min(1).nullable(),
});

export const transactionSchema = persistedTransactionSchema;

export const createManualTransactionSchema = transactionBaseSchema.extend({
  source: z.literal("manual").default("manual"),
  referenceNumber: trimmedOptionalReferenceSchema.nullish(),
  notes: trimmedOptionalTextSchema.nullish(),
});

export const updateTransactionEditableFieldsSchema = z
  .object({
    merchant: trimmedRequiredTextSchema,
    category: transactionCategorySchema,
    notes: trimmedOptionalTextSchema.nullish(),
  })
  .transform((value) => ({
    merchant: value.merchant,
    category: value.category,
    notes: value.notes ?? null,
  }));

export const createManualTransactionFormSchema = z
  .object({
    direction: transactionDirectionSchema,
    amount: z.string().trim(),
    currencyCode: z.string().optional(),
    bankName: supportedBankSchema,
    merchant: z.string().trim(),
    description: z.string().trim(),
    category: transactionCategorySchema,
    referenceNumber: z.string().trim().nullish(),
    notes: z.string().trim().nullish(),
    status: transactionStatusSchema.optional(),
    happenedAt: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    let hasIssue = false;

    const amountNum = parseNumericInput(value.amount as string);
    if (Number.isNaN(amountNum)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be a valid number",
        path: ["amount"],
      });
      hasIssue = true;
    } else if (amountNum <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be greater than 0",
        path: ["amount"],
      });
      hasIssue = true;
    }

    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value.happenedAt as string)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date must be in YYYY-MM-DD format",
        path: ["happenedAt"],
      });
      hasIssue = true;
    } else {
      const dt = new Date((value.happenedAt as string) + "T00:00:00");
      if (Number.isNaN(dt.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date",
          path: ["happenedAt"],
        });
        hasIssue = true;
      } else if (dt.getTime() > Date.now() + 1000 * 60 * 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date cannot be in the future",
          path: ["happenedAt"],
        });
        hasIssue = true;
      }
    }

    if (!hasIssue) {
      const mapped = {
        direction: value.direction,
        amount: amountNum,
        currencyCode:
          value.currencyCode && (value.currencyCode as string).trim().length > 0
            ? (value.currencyCode as string)
            : undefined,
        bankName: value.bankName,
        merchant: value.merchant,
        description: value.description,
        category: value.category,
        referenceNumber: value.referenceNumber,
        notes: value.notes,
        status: value.status,
        happenedAt: value.happenedAt,
      } as unknown;

      const parsed = createManualTransactionSchema.safeParse(mapped);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: issue.path as (string | number)[],
          });
        });
      }
    }
  })
  .transform((value) =>
    createManualTransactionSchema.parse({
      direction: value.direction,
      amount: parseNumericInput(value.amount as string),
      currencyCode:
        value.currencyCode && (value.currencyCode as string).trim().length > 0
          ? (value.currencyCode as string)
          : undefined,
      bankName: value.bankName,
      merchant: value.merchant,
      description: value.description,
      category: value.category,
      referenceNumber: value.referenceNumber,
      notes: value.notes,
      status: value.status,
      happenedAt: value.happenedAt,
    })
  );

export const transactionQuerySchema = z.object({
  bankName: supportedBankSchema.optional(),
  category: transactionCategorySchema.optional(),
  direction: transactionDirectionSchema.optional(),
  status: transactionStatusSchema.optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(20),
}).superRefine((value, ctx) => {
  if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start date must be before or equal to end date.",
      path: ["dateFrom"],
    });
  }
});

export const transactionOverviewQuerySchema = z.object({
  period: transactionOverviewPeriodSchema.optional().default("monthly"),
});

export const gmailSyncSchema = z.object({
  query: z.string().trim().min(1).optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  maxPages: z.number().int().min(1).max(20).optional(),
  daysBack: z.number().int().min(1).max(730).optional(),
  reprocessExisting: z.boolean().optional(),
});

export const gmailSyncReviewCommitSchema = z.object({
  reviewBatchId: z.string().uuid(),
  selectedReviewItemIds: z.array(z.string().uuid()).default([]),
});
