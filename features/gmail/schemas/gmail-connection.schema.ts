import { z } from "zod";

export const gmailConnectionSummarySchema = z.object({
  id: z.string().uuid(),
  provider: z.literal("google"),
  email: z.string().email(),
  hasRefreshToken: z.boolean(),
  lastSyncedAt: z.string().datetime({ offset: true }).nullable(),
  scopes: z.array(z.string()),
});

export const gmailConnectionStatusSchema = z.object({
  connected: z.boolean(),
  connection: gmailConnectionSummarySchema.nullable(),
});
