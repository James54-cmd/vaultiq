import { z } from "zod";

export const gmailEnvSchema = z.object({
  GMAIL_SYNC_MAX_RESULTS: z.coerce.number().int().min(1).max(50).optional(),
});

export type GmailEnv = z.infer<typeof gmailEnvSchema>;
