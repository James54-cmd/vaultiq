import { z } from "zod";

import {
  financialAccountKinds,
  financialAccountSources,
  financialAccountStatuses,
  financialAccountTypes,
} from "@/features/accounts/constants/account.constants";
import { supportedCurrencyCodes } from "@/lib/currency";

export const financialAccountIdSchema = z.string().uuid();
export const financialAccountTypeSchema = z.enum(financialAccountTypes);
export const financialAccountKindSchema = z.enum(financialAccountKinds);
export const financialAccountSourceSchema = z.enum(financialAccountSources);
export const financialAccountStatusSchema = z.enum(financialAccountStatuses);
export const financialAccountCurrencyCodeSchema = z.enum(supportedCurrencyCodes);

const amountSchema = z.number().finite().nonnegative();
const datetimeStringSchema = z.string().datetime({ offset: true });
const trimmedRequiredTextSchema = z.string().trim().min(1).max(160);
const trimmedOptionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));

const parseNumericInput = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  const cleaned = value.trim().replace(/,/g, "").replace(/[^0-9.-]+/g, "");
  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const financialAccountBaseSchema = z.object({
  name: trimmedRequiredTextSchema,
  institutionName: trimmedRequiredTextSchema,
  accountType: financialAccountTypeSchema,
  kind: financialAccountKindSchema,
  source: financialAccountSourceSchema.default("manual"),
  currencyCode: financialAccountCurrencyCodeSchema.default("PHP"),
  currentBalance: amountSchema,
  creditLimit: amountSchema.nullable(),
  includeInNetWorth: z.boolean().default(true),
  status: financialAccountStatusSchema.default("active"),
  lastSyncedAt: datetimeStringSchema.nullable(),
  notes: trimmedOptionalTextSchema.nullable(),
});

export const financialAccountSchema = z.object({
  id: financialAccountIdSchema,
  ...financialAccountBaseSchema.shape,
  createdAt: datetimeStringSchema,
  updatedAt: datetimeStringSchema,
});

export const createFinancialAccountSchema = financialAccountBaseSchema.extend({
  notes: trimmedOptionalTextSchema.nullish(),
  creditLimit: amountSchema.nullish(),
  lastSyncedAt: datetimeStringSchema.nullish(),
});

export const updateFinancialAccountSchema = createFinancialAccountSchema.partial();

export const createFinancialAccountFormSchema = z
  .object({
    name: z.string().trim(),
    institutionName: z.string().trim(),
    accountType: financialAccountTypeSchema,
    kind: financialAccountKindSchema,
    source: financialAccountSourceSchema.optional(),
    currencyCode: financialAccountCurrencyCodeSchema.optional(),
    currentBalance: z.string().trim(),
    creditLimit: z.string().trim().optional(),
    includeInNetWorth: z.boolean().optional(),
    status: financialAccountStatusSchema.optional(),
    notes: z.string().trim().nullish(),
  })
  .transform((value) =>
    createFinancialAccountSchema.parse({
      name: value.name,
      institutionName: value.institutionName,
      accountType: value.accountType,
      kind: value.kind,
      source: value.source,
      currencyCode: value.currencyCode,
      currentBalance: parseNumericInput(value.currentBalance) ?? Number.NaN,
      creditLimit:
        value.creditLimit && value.creditLimit.trim().length > 0
          ? parseNumericInput(value.creditLimit) ?? Number.NaN
          : null,
      includeInNetWorth: value.includeInNetWorth ?? true,
      status: value.status,
      notes: value.notes,
      lastSyncedAt: null,
    })
  );
