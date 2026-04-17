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
const parseNumericInput = (value?: string) =>
  value && value.trim().length > 0 ? Number(value) : Number.NaN;

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

export const createManualTransactionFormSchema = z
  .object({
    direction: transactionDirectionSchema,
    amount: z.string(),
    currencyCode: z.string().optional(),
    bankName: supportedBankSchema,
    merchant: z.string(),
    description: z.string(),
    category: transactionCategorySchema,
    referenceNumber: z.string().nullish(),
    notes: z.string().nullish(),
    status: transactionStatusSchema.optional(),
    happenedAt: z.string(),
  })
  .transform((value) =>
    createManualTransactionSchema.parse({
      direction: value.direction,
      amount: parseNumericInput(value.amount),
      currencyCode:
        value.currencyCode && value.currencyCode.trim().length > 0
          ? value.currencyCode
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
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(20),
});

export const transactionOverviewQuerySchema = z.object({
  period: transactionOverviewPeriodSchema.optional().default("monthly"),
});

export const gmailSyncSchema = z.object({
  query: z.string().trim().min(1).optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  maxPages: z.number().int().min(1).max(20).optional(),
  daysBack: z.number().int().min(1).max(730).optional(),
});
