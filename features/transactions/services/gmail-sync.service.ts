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

const gmailMessageDetailBatchSize = 10;
const gmailMessageLookupBatchSize = 100;
const incrementalSyncOverlapDays = 2;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

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

function calculateIncrementalLookbackDays(lastSyncedAt: string | null) {
  if (!lastSyncedAt) {
    return null;
  }

  const lastSyncedTime = Date.parse(lastSyncedAt);

  if (Number.isNaN(lastSyncedTime)) {
    return null;
  }

  const elapsedDays = Math.ceil(
    Math.max(0, Date.now() - lastSyncedTime) / millisecondsPerDay
  );

  return Math.min(
    defaultGmailSyncLookbackDays,
    Math.max(1, elapsedDays + incrementalSyncOverlapDays)
  );
}

async function getExistingGmailMessageIds(
  supabase: SupabaseClient,
  messageIds: string[]
) {
  const existingMessageIds = new Set<string>();

  for (let index = 0; index < messageIds.length; index += gmailMessageLookupBatchSize) {
    const batch = messageIds.slice(index, index + gmailMessageLookupBatchSize);

    if (batch.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("gmail_message_id")
      .in("gmail_message_id", batch);

    if (error) {
      throw new Error(error.message);
    }

    (data ?? []).forEach((row) => {
      if (typeof row.gmail_message_id === "string" && row.gmail_message_id.length > 0) {
        existingMessageIds.add(row.gmail_message_id);
      }
    });
  }

  return existingMessageIds;
}

async function hasAnyTransactions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
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
  const maxResults = parsedInput.maxResults ?? env.GMAIL_SYNC_MAX_RESULTS ?? defaultGmailSyncMaxResultsPerPage;
  const maxPages = parsedInput.maxPages ?? defaultGmailSyncMaxPages;
  const { connection, accessToken } = await getValidGmailAccessToken(supabase, userId);
  const ledgerHasTransactions = await hasAnyTransactions(supabase);
  const daysBack =
    parsedInput.daysBack ??
    (ledgerHasTransactions
      ? calculateIncrementalLookbackDays(connection.lastSyncedAt)
      : null) ??
    defaultGmailSyncLookbackDays;
  const query = buildGmailSyncQuery(parsedInput.query ?? defaultGmailSyncBaseQuery, daysBack);
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
  const existingMessageIds = await getExistingGmailMessageIds(
    supabase,
    messages.map((message) => message.id)
  );
  const unsyncedMessages = messages.filter((message) => !existingMessageIds.has(message.id));
  const details = await fetchGmailMessageDetailsInBatches(accessToken, unsyncedMessages);

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
    existingMessageCount: existingMessageIds.size,
    parsedTransactions,
    skippedMessages,
  };
}
