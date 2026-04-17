import { z } from "zod";

export const gmailEnvSchema = z.object({
  GMAIL_ACCESS_TOKEN: z.string().min(1, "Gmail access token is required."),
  GMAIL_SYNC_QUERY: z.string().min(1).default('subject:"Payment Successful" newer_than:30d'),
  GMAIL_SYNC_MAX_RESULTS: z.coerce.number().int().min(1).max(25).default(10),
});

export type GmailEnv = z.infer<typeof gmailEnvSchema>;
