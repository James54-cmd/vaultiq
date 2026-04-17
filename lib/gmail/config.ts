import "server-only";

import { gmailEnvSchema } from "@/schemas/gmail-env.schema";

export function getGmailEnv() {
  return gmailEnvSchema.parse({
    GMAIL_SYNC_MAX_RESULTS: process.env.GMAIL_SYNC_MAX_RESULTS,
  });
}
