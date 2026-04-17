import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultGmailSyncSettings, getGmailMessage, listGmailMessages } from "@/lib/gmail/client";
import { getValidGmailAccessToken, markGmailConnectionSynced } from "@/features/gmail/services/gmail-connection.service";
import { gmailSyncSchema } from "@/features/transactions/schemas/transaction.schema";
import { parseGmailPaymentEmail } from "@/features/transactions/utils/parseGmailPaymentEmail";

export async function fetchParsedGmailTransactions(
  supabase: SupabaseClient,
  userId: string,
  input?: unknown
) {
  const defaults = getDefaultGmailSyncSettings();
  const parsedInput = gmailSyncSchema.parse({
    query: defaults.query,
    maxResults: defaults.maxResults,
    ...(typeof input === "object" && input !== null ? input : {}),
  });

  const { connection, accessToken } = await getValidGmailAccessToken(supabase, userId);
  const messages = await listGmailMessages(
    accessToken,
    parsedInput.query ?? defaults.query,
    parsedInput.maxResults ?? defaults.maxResults
  );
  const details = await Promise.all(messages.map((message) => getGmailMessage(accessToken, message.id)));

  await markGmailConnectionSynced(supabase, connection.id);

  return details
    .map(parseGmailPaymentEmail)
    .filter((transaction): transaction is NonNullable<typeof transaction> => Boolean(transaction));
}
