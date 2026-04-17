import "server-only";

import { gmailEnvSchema } from "@/schemas/gmail-env.schema";

export function getGmailEnv() {
  return gmailEnvSchema.parse({
    GMAIL_ACCESS_TOKEN: process.env.GMAIL_ACCESS_TOKEN,
    GMAIL_SYNC_QUERY: process.env.GMAIL_SYNC_QUERY,
    GMAIL_SYNC_MAX_RESULTS: process.env.GMAIL_SYNC_MAX_RESULTS,
  });
}
