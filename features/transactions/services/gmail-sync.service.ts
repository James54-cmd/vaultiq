import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getGmailMessage, listGmailMessages } from "@/lib/gmail/client";
import { getValidGmailAccessToken, markGmailConnectionSynced } from "@/features/gmail/services/gmail-connection.service";
import {
  defaultGmailSyncBaseQuery,
  defaultGmailSyncLookbackDays,
  defaultGmailSyncMaxPages,
  defaultGmailSyncMaxResultsPerPage,
} from "@/features/transactions/constants/gmail-sync.constants";
import { gmailSyncSchema } from "@/features/transactions/schemas/transaction.schema";
import { parseGmailPaymentEmail } from "@/features/transactions/utils/parseGmailPaymentEmail";
import type { ParsedGmailTransactionsResult } from "@/features/transactions/types/Transaction";
import { getGmailEnv } from "@/lib/gmail/config";

const gmailMessageDetailBatchSize = 5;

function buildGmailSyncQuery(baseQuery: string, daysBack: number) {
  const trimmedQuery = baseQuery.trim();

  if (/\b(?:newer_than|older_than|after:|before:)\b/i.test(trimmedQuery)) {
    return trimmedQuery;
  }

  return `(${trimmedQuery}) newer_than:${daysBack}d`;
}

async function fetchGmailMessageDetailsInBatches(
  accessToken: string,
  messages: Array<{ id: string }>
) {
  const details = [];

  for (let index = 0; index < messages.length; index += gmailMessageDetailBatchSize) {
    const batch = messages.slice(index, index + gmailMessageDetailBatchSize);
    const batchDetails = await Promise.all(
      batch.map((message) => getGmailMessage(accessToken, message.id))
    );

    details.push(...batchDetails);
  }

  return details;
}

export async function fetchParsedGmailTransactions(
  supabase: SupabaseClient,
  userId: string,
  input?: unknown
): Promise<ParsedGmailTransactionsResult> {
  const env = getGmailEnv();
  const parsedInput = gmailSyncSchema.parse(
    typeof input === "object" && input !== null ? input : {}
  );
  const daysBack = parsedInput.daysBack ?? defaultGmailSyncLookbackDays;
  const maxResults = parsedInput.maxResults ?? env.GMAIL_SYNC_MAX_RESULTS ?? defaultGmailSyncMaxResultsPerPage;
  const maxPages = parsedInput.maxPages ?? defaultGmailSyncMaxPages;
  const query = buildGmailSyncQuery(parsedInput.query ?? defaultGmailSyncBaseQuery, daysBack);

  const { connection, accessToken } = await getValidGmailAccessToken(supabase, userId);
  const messageMap = new Map<string, { id: string; threadId: string }>();
  let nextPageToken: string | null = null;
  let pagesFetched = 0;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await listGmailMessages(
      accessToken,
      query,
      maxResults,
      pageIndex === 0 ? null : nextPageToken
    );

    pagesFetched += 1;

    page.messages.forEach((message) => {
      if (!messageMap.has(message.id)) {
        messageMap.set(message.id, message);
      }
    });

    nextPageToken = page.nextPageToken;

    if (!nextPageToken || page.messages.length === 0) {
      break;
    }
  }

  const messages = Array.from(messageMap.values());
  const details = await fetchGmailMessageDetailsInBatches(accessToken, messages);

  await markGmailConnectionSynced(supabase, connection.id);

  const parsedTransactions = [];
  const skippedMessages = [];

  for (const detail of details) {
    const result = parseGmailPaymentEmail(detail);

    if (result.kind === "parsed") {
      parsedTransactions.push(result.transaction);
      continue;
    }

    skippedMessages.push(result.skippedMessage);
  }

  return {
    query,
    daysBack,
    pagesFetched,
    matchedMessageCount: messages.length,
    parsedTransactions,
    skippedMessages,
  };
}
