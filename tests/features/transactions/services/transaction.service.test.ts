import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";

import type {
  ParsedGmailTransaction,
  ParsedGmailTransactionsResult,
} from "@/features/transactions/types/Transaction";
import type { TransactionRecord } from "@/features/transactions/types/TransactionRecord";

let parsedTransactionsResult: ParsedGmailTransactionsResult;

const fetchParsedGmailTransactionsMock = mock.fn(async () => parsedTransactionsResult);

await mock.module("@/features/transactions/services/gmail-sync.service", {
  namedExports: {
    fetchParsedGmailTransactions: fetchParsedGmailTransactionsMock,
  },
});

const { syncGmailTransactions } = await import("@/features/transactions/services/transaction.service");

function createParsedTransaction(
  overrides: Partial<ParsedGmailTransaction> = {}
): ParsedGmailTransaction {
  return {
    source: "gmail",
    direction: "transfer",
    amount: 150,
    currencyCode: "PHP",
    bankName: "MariBank",
    merchant: "MariBank Philippines",
    description: "Successful MariBank Transfer",
    category: "transfers",
    referenceNumber: null,
    status: "completed",
    happenedAt: "2026-04-18T06:13:21.000Z",
    gmailMessageId: "gmail-msg-1",
    gmailThreadId: "gmail-thread-1",
    rawPayload: {
      subject: "Successful MariBank Transfer",
      from: "MariBank Philippines <notifications@maribank.ph>",
    },
    ...overrides,
  };
}

function createParsedTransactionsResult(
  overrides: Partial<ParsedGmailTransactionsResult> = {}
): ParsedGmailTransactionsResult {
  return {
    query: "from:maribank",
    daysBack: 365,
    pagesFetched: 1,
    matchedMessageCount: 1,
    existingMessageCount: 0,
    parsedExistingMessageCount: 0,
    parsedTransactions: [createParsedTransaction()],
    skippedMessages: [],
    ...overrides,
  };
}

function createSupabaseUpsertStub() {
  const records = new Map<string, TransactionRecord>();

  return {
    records,
    supabase: {
      rpc: async (functionName: string, payload: Record<string, unknown>) => {
        assert.equal(functionName, "ingest_gmail_transaction");

        const gmailMessageId = String(payload.p_gmail_message_id);
        const existingRecord = records.get(gmailMessageId);
        const timestamp = "2026-04-18T06:13:21.000Z";
        const nextRecord: TransactionRecord = {
          id: existingRecord?.id ?? `txn-${records.size + 1}`,
          source: "gmail",
          direction: payload.p_direction as TransactionRecord["direction"],
          amount: Number(payload.p_amount),
          currency_code: String(payload.p_currency_code),
          bank_name: String(payload.p_bank_name),
          merchant: String(payload.p_merchant),
          description: String(payload.p_description),
          category: String(payload.p_category),
          reference_number: (payload.p_reference_number as string | null) ?? null,
          notes: null,
          status: payload.p_status as TransactionRecord["status"],
          happened_at: String(payload.p_happened_at),
          created_at: existingRecord?.created_at ?? timestamp,
          updated_at: timestamp,
          gmail_message_id: gmailMessageId,
          gmail_thread_id: (payload.p_gmail_thread_id as string | null) ?? null,
        };

        records.set(gmailMessageId, nextRecord);

        return {
          data: nextRecord,
          error: null,
        };
      },
    },
  };
}

beforeEach(() => {
  parsedTransactionsResult = createParsedTransactionsResult();
  fetchParsedGmailTransactionsMock.mock.resetCalls();
});

test("full resync updates an existing Gmail row without creating a duplicate", async () => {
  const store = createSupabaseUpsertStub();

  const firstSync = await syncGmailTransactions(store.supabase as never, "user-1");

  assert.equal(firstSync.insertedCount, 1);
  assert.equal(firstSync.updatedCount, 0);
  assert.equal(store.records.size, 1);
  assert.equal(store.records.get("gmail-msg-1")?.reference_number, null);

  parsedTransactionsResult = createParsedTransactionsResult({
    existingMessageCount: 1,
    parsedExistingMessageCount: 1,
    parsedTransactions: [
      createParsedTransaction({
        referenceNumber: "BC550000016798279517",
      }),
    ],
  });

  const secondSync = await syncGmailTransactions(store.supabase as never, "user-1", {
    reprocessExisting: true,
  });

  assert.equal(secondSync.insertedCount, 0);
  assert.equal(secondSync.updatedCount, 1);
  assert.equal(store.records.size, 1);
  assert.equal(store.records.get("gmail-msg-1")?.reference_number, "BC550000016798279517");
  assert.equal(fetchParsedGmailTransactionsMock.mock.calls.length, 2);
});
