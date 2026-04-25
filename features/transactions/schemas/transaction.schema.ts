import { z } from "zod";

import {
  supportedBanks,
  transactionCategories,
  transactionDirections,
  transactionOverviewPeriods,
  transactionSources,
  transactionStatuses,
  transactionTypes,
} from "@/features/transactions/constants/transaction.constants";

export const transactionIdSchema = z.string().uuid();
export const transactionTypeSchema = z.enum(transactionTypes);
export const transactionDirectionSchema = z.enum(transactionDirections);
export const transactionSourceSchema = z.enum(transactionSources);
export const transactionStatusSchema = z.preprocess((value) => {
  if (value === "completed") return "confirmed";
  if (value === "flagged") return "needs_review";
  return value;
}, z.enum(transactionStatuses));
export const transactionCategorySchema = z.enum(transactionCategories);
export const supportedBankSchema = z.enum(supportedBanks);
export const transactionOverviewPeriodSchema = z.enum(transactionOverviewPeriods);

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency code must be a 3-letter ISO code.")
  .default("PHP");
const dateStringSchema = z.string().date();
const datetimeStringSchema = z.string().datetime({ offset: true });
const amountSchema = z.number().finite();
const optionalUuidSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 || value === "none" ? null : value))
  .pipe(transactionIdSchema.nullable());
const sourceMetadataSchema = z.record(z.unknown()).nullable();

const parseNumericInput = (value?: string | number | null) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (!value || value.trim().length === 0) {
    return Number.NaN;
  }

  const cleaned = value.trim().replace(/,/g, "").replace(/[^0-9.-]+/g, "");
  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
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

function legacyDirectionForType(type: z.infer<typeof transactionTypeSchema>, amount: number) {
  if (type === "transfer") return "transfer" as const;
  if (type === "income" || type === "refund") return "income" as const;
  if (type === "adjustment" && amount > 0) return "income" as const;
  return "expense" as const;
}

function normalizeAmountForType(type: z.infer<typeof transactionTypeSchema>, amount: number) {
  if (type === "adjustment") {
    return Number(amount.toFixed(2));
  }

  return Number(Math.abs(amount).toFixed(2));
}

function normalizeTransactionInput<T extends {
  type: z.infer<typeof transactionTypeSchema>;
  amount: number;
  merchantName: string;
  description?: string | null;
  category?: z.infer<typeof transactionCategorySchema>;
  referenceNumber?: string | null;
  notes?: string | null;
  status?: z.infer<typeof transactionStatusSchema>;
  source?: z.infer<typeof transactionSourceSchema>;
  sourceId?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  originalTransactionId?: string | null;
  transactionDate: string;
  currencyCode?: string;
}>(value: T) {
  const amount = normalizeAmountForType(value.type, value.amount);
  const merchantName = value.merchantName.trim();
  const description = value.description?.trim() || merchantName;

  return {
    source: value.source ?? "manual",
    sourceId: value.sourceId ?? null,
    sourceMetadata: value.sourceMetadata ?? null,
    type: value.type,
    direction: legacyDirectionForType(value.type, amount),
    amount,
    currencyCode: value.currencyCode ?? "PHP",
    accountId: value.type === "transfer" ? value.fromAccountId ?? value.accountId ?? null : value.accountId ?? null,
    fromAccountId: value.type === "transfer" ? value.fromAccountId ?? null : null,
    toAccountId: value.type === "transfer" ? value.toAccountId ?? null : null,
    originalTransactionId: value.originalTransactionId ?? null,
    merchantName,
    merchant: merchantName,
    description,
    category: value.category ?? "uncategorized",
    referenceNumber: value.referenceNumber ?? null,
    notes: value.notes ?? null,
    status: value.status ?? "confirmed",
    transactionDate: value.transactionDate,
    happenedAt: value.transactionDate,
  };
}

const transactionCommonInputSchema = z
  .object({
    source: transactionSourceSchema.default("manual"),
    sourceId: trimmedOptionalReferenceSchema.nullish(),
    sourceMetadata: sourceMetadataSchema.nullish(),
    type: transactionTypeSchema,
    direction: transactionDirectionSchema.optional(),
    amount: amountSchema,
    currencyCode: currencyCodeSchema,
    accountId: optionalUuidSchema.nullish(),
    fromAccountId: optionalUuidSchema.nullish(),
    toAccountId: optionalUuidSchema.nullish(),
    originalTransactionId: optionalUuidSchema.nullish(),
    merchantName: z.string().trim().max(160).nullish(),
    merchant: z.string().trim().max(160).nullish(),
    description: z.string().trim().max(160).nullish(),
    category: transactionCategorySchema.default("uncategorized"),
    referenceNumber: trimmedOptionalReferenceSchema.nullish(),
    notes: trimmedOptionalTextSchema.nullish(),
    status: transactionStatusSchema.default("confirmed"),
    transactionDate: dateStringSchema,
  })
  .superRefine((value, ctx) => {
    const normalizedAmount = normalizeAmountForType(value.type, value.amount);
    const merchantName = value.merchantName || value.merchant || "";

    if (merchantName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Merchant or title is required.",
        path: ["merchantName"],
      });
    }

    if (value.type === "adjustment") {
      if (normalizedAmount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Adjustment amount must be non-zero.",
          path: ["amount"],
        });
      }

      if (!value.notes || value.notes.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Adjustment note is required.",
          path: ["notes"],
        });
      }
    } else if (normalizedAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be greater than 0.",
        path: ["amount"],
      });
    }

    if (value.status === "confirmed" || value.source === "manual") {
      if (value.type === "transfer") {
        if (!value.fromAccountId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Source account is required for transfers.",
            path: ["fromAccountId"],
          });
        }

        if (!value.toAccountId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Destination account is required for transfers.",
            path: ["toAccountId"],
          });
        }
      } else if (!value.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account is required.",
          path: ["accountId"],
        });
      }
    }

    if (value.fromAccountId && value.toAccountId && value.fromAccountId === value.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer accounts must be different.",
        path: ["toAccountId"],
      });
    }

    const transactionDate = new Date(`${value.transactionDate}T00:00:00`);
    if (Number.isNaN(transactionDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid transaction date.",
        path: ["transactionDate"],
      });
    } else if (transactionDate.getTime() > Date.now() + 1000 * 60 * 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date cannot be in the future.",
        path: ["transactionDate"],
      });
    }
  })
  .transform((value) =>
    normalizeTransactionInput({
      ...value,
      merchantName: value.merchantName || value.merchant || "",
      description: value.description ?? value.merchant ?? value.merchantName,
      sourceId: value.sourceId ?? null,
      sourceMetadata: value.sourceMetadata ?? null,
      accountId: value.accountId ?? null,
      fromAccountId: value.fromAccountId ?? null,
      toAccountId: value.toAccountId ?? null,
      originalTransactionId: value.originalTransactionId ?? null,
      referenceNumber: value.referenceNumber ?? null,
      notes: value.notes ?? null,
    })
  );

const persistedTransactionSchema = z.object({
  id: transactionIdSchema,
  source: transactionSourceSchema,
  sourceId: z.string().trim().min(1).nullable(),
  sourceMetadata: sourceMetadataSchema,
  type: transactionTypeSchema,
  direction: transactionDirectionSchema,
  amount: amountSchema,
  signedAmount: amountSchema.optional(),
  currencyCode: currencyCodeSchema,
  accountId: transactionIdSchema.nullable(),
  accountName: z.string().trim().min(1).nullable(),
  fromAccountId: transactionIdSchema.nullable(),
  fromAccountName: z.string().trim().min(1).nullable(),
  toAccountId: transactionIdSchema.nullable(),
  toAccountName: z.string().trim().min(1).nullable(),
  originalTransactionId: transactionIdSchema.nullable(),
  bankName: supportedBankSchema.or(z.string().trim().min(1)),
  bankInitials: z.string().optional(),
  merchantName: trimmedRequiredTextSchema,
  merchant: trimmedRequiredTextSchema,
  description: trimmedRequiredTextSchema,
  category: transactionCategorySchema,
  categoryLabel: z.string().optional(),
  referenceNumber: z.string().trim().min(1).nullable(),
  notes: z.string().trim().min(1).nullable(),
  status: transactionStatusSchema,
  kindLabel: z.string().optional(),
  transactionDate: datetimeStringSchema,
  happenedAt: datetimeStringSchema,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
  gmailMessageId: z.string().trim().min(1).nullable(),
  gmailThreadId: z.string().trim().min(1).nullable(),
});

export const transactionSchema = persistedTransactionSchema;
export const createTransactionSchema = transactionCommonInputSchema;
export const updateTransactionSchema = transactionCommonInputSchema;

export const createManualTransactionSchema = transactionCommonInputSchema.transform((value) => ({
  ...value,
  source: "manual" as const,
}));

export const updateTransactionEditableFieldsSchema = updateTransactionSchema;

export const createTransactionFormSchema = z
  .object({
    source: transactionSourceSchema.optional(),
    sourceId: z.string().trim().nullish(),
    type: transactionTypeSchema,
    direction: transactionDirectionSchema.optional(),
    amount: z.string().trim(),
    currencyCode: z.string().optional(),
    accountId: z.string().trim().nullish(),
    fromAccountId: z.string().trim().nullish(),
    toAccountId: z.string().trim().nullish(),
    originalTransactionId: z.string().trim().nullish(),
    merchantName: z.string().trim(),
    merchant: z.string().trim().nullish(),
    description: z.string().trim().nullish(),
    category: transactionCategorySchema.optional(),
    referenceNumber: z.string().trim().nullish(),
    notes: z.string().trim().nullish(),
    status: transactionStatusSchema.optional(),
    transactionDate: z.string().trim(),
    happenedAt: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const amountNum = parseNumericInput(value.amount);

    if (Number.isNaN(amountNum)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be a valid number.",
        path: ["amount"],
      });
      return;
    }

    const parsed = createTransactionSchema.safeParse({
      source: value.source ?? "manual",
      sourceId: value.sourceId,
      type: value.type,
      direction: value.direction,
      amount: amountNum,
      currencyCode:
        value.currencyCode && value.currencyCode.trim().length > 0
          ? value.currencyCode
          : undefined,
      accountId: value.accountId,
      fromAccountId: value.fromAccountId,
      toAccountId: value.toAccountId,
      originalTransactionId: value.originalTransactionId,
      merchantName: value.merchantName || value.merchant || "",
      merchant: value.merchant,
      description: value.description || value.merchantName || value.merchant,
      category: value.category ?? "uncategorized",
      referenceNumber: value.referenceNumber,
      notes: value.notes,
      status: value.status,
      transactionDate: value.transactionDate || value.happenedAt,
    });

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: issue.path as (string | number)[],
        });
      });
    }
  })
  .transform((value) =>
    createTransactionSchema.parse({
      source: value.source ?? "manual",
      sourceId: value.sourceId,
      type: value.type,
      direction: value.direction,
      amount: parseNumericInput(value.amount),
      currencyCode:
        value.currencyCode && value.currencyCode.trim().length > 0
          ? value.currencyCode
          : undefined,
      accountId: value.accountId,
      fromAccountId: value.fromAccountId,
      toAccountId: value.toAccountId,
      originalTransactionId: value.originalTransactionId,
      merchantName: value.merchantName || value.merchant || "",
      merchant: value.merchant,
      description: value.description || value.merchantName || value.merchant,
      category: value.category ?? "uncategorized",
      referenceNumber: value.referenceNumber,
      notes: value.notes,
      status: value.status,
      transactionDate: value.transactionDate || value.happenedAt,
    })
  );

export const createManualTransactionFormSchema = createTransactionFormSchema;

export const transactionQuerySchema = z.object({
  bankName: supportedBankSchema.optional(),
  category: transactionCategorySchema.optional(),
  type: transactionTypeSchema.optional(),
  direction: transactionTypeSchema.optional(),
  source: transactionSourceSchema.optional(),
  status: transactionStatusSchema.optional(),
  accountId: transactionIdSchema.optional(),
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
