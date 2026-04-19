import { z } from "zod";

import { supportedCurrencyCodes } from "@/lib/currency";

export const primaryCurrencyCodeSchema = z.enum(supportedCurrencyCodes);

export const userPreferencesSchema = z.object({
  userId: z.string().uuid(),
  primaryCurrencyCode: primaryCurrencyCodeSchema.default("PHP"),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const updateUserPreferencesSchema = z.object({
  primaryCurrencyCode: primaryCurrencyCodeSchema,
});
