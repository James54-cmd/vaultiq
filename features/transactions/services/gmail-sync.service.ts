import "server-only";

import { getDefaultGmailSyncSettings, getGmailMessage, listGmailMessages } from "@/lib/gmail/client";
import { gmailSyncSchema } from "@/features/transactions/schemas/transaction.schema";
import { parseGmailPaymentEmail } from "@/features/transactions/utils/parseGmailPaymentEmail";

export async function fetchParsedGmailTransactions(input?: unknown) {
  const defaults = getDefaultGmailSyncSettings();
  const parsedInput = gmailSyncSchema.parse({
    query: defaults.query,
    maxResults: defaults.maxResults,
    ...(typeof input === "object" && input !== null ? input : {}),
  });

  const messages = await listGmailMessages(parsedInput.query ?? defaults.query, parsedInput.maxResults ?? defaults.maxResults);
  const details = await Promise.all(messages.map((message) => getGmailMessage(message.id)));

  return details
    .map(parseGmailPaymentEmail)
    .filter((transaction): transaction is NonNullable<typeof transaction> => Boolean(transaction));
}
