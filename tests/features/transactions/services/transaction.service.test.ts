import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";

import type {
  ParsedGmailTransaction,
  ParsedGmailTransactionsResult,
} from "@/features/transactions/types/Transaction";
import type {
  GmailTransactionReviewRecord,
  TransactionRecord,
} from "@/features/transactions/types/TransactionRecord";

let parsedTransactionsResult: ParsedGmailTransactionsResult;

const fetchParsedGmailTransactionsMock = mock.fn(async () => parsedTransactionsResult);

await mock.module("@/features/transactions/services/gmail-sync.service", {
  namedExports: {
    fetchParsedGmailTransactions: fetchParsedGmailTransactionsMock,
  },
});

const {
  commitGmailTransactionReview,
  syncGmailTransactions,
  updateTransactionEditableFields,
} = await import("@/features/transactions/services/transaction.service");

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
  const reviewRecords = new Map<string, GmailTransactionReviewRecord>();

  function createTransactionRecord(payload: Record<string, unknown>) {
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
    return nextRecord;
  }

  function createReviewRecord(row: Record<string, unknown>) {
    const existingRecord = reviewRecords.get(String(row.gmail_message_id));
    const timestamp = "2026-04-18T06:13:21.000Z";
    const nextIndex = reviewRecords.size + 1;
    const nextRecord: GmailTransactionReviewRecord = {
      id: existingRecord?.id ?? `22222222-2222-4222-8222-${String(nextIndex).padStart(12, "0")}`,
      review_batch_id: String(row.review_batch_id),
      user_id: String(row.user_id),
      gmail_message_id: String(row.gmail_message_id),
      gmail_thread_id: (row.gmail_thread_id as string | null) ?? null,
      direction: row.direction as GmailTransactionReviewRecord["direction"],
      amount: Number(row.amount),
      currency_code: String(row.currency_code),
      bank_name: String(row.bank_name),
      merchant: String(row.merchant),
      description: String(row.description),
      category: String(row.category),
      reference_number: (row.reference_number as string | null) ?? null,
      status: row.status as GmailTransactionReviewRecord["status"],
      review_status: row.review_status as GmailTransactionReviewRecord["review_status"],
      happened_at: String(row.happened_at),
      raw_payload: row.raw_payload as Record<string, unknown>,
      transaction_id: (row.transaction_id as string | null) ?? null,
      created_at: existingRecord?.created_at ?? timestamp,
      updated_at: timestamp,
    };

    reviewRecords.set(nextRecord.gmail_message_id, nextRecord);
    return nextRecord;
  }

  function createSelectQuery(tableName: string) {
    const filters: Record<string, unknown> = {};
    const inFilters: Record<string, unknown[]> = {};
    const execute = () => {
      if (tableName === "transactions") {
        return {
          data: Array.from(records.values()).filter((record) => {
            const gmailIds = inFilters.gmail_message_id;
            return !gmailIds || gmailIds.includes(record.gmail_message_id);
          }),
          error: null,
        };
      }

      return {
        data: Array.from(reviewRecords.values()).filter((record) => {
          const messageIds = inFilters.gmail_message_id;
          return Object.entries(filters).every(([key, value]) => record[key as keyof GmailTransactionReviewRecord] === value)
            && (!messageIds || messageIds.includes(record.gmail_message_id));
        }),
        error: null,
      };
    };
    const query = {
      eq: (column: string, value: unknown) => {
        filters[column] = value;
        return query;
      },
      in: (column: string, values: unknown[]) => {
        inFilters[column] = values;
        return query;
      },
      then: (resolve: (value: ReturnType<typeof execute>) => void) => Promise.resolve(execute()).then(resolve),
    };

    return query;
  }

  function createUpdateQuery(payload: Record<string, unknown>) {
    const execute = (ids: string[]) => {
      const updatedRecords = [];

      for (const record of reviewRecords.values()) {
        if (ids.includes(record.id)) {
          const nextRecord = {
            ...record,
            ...payload,
            updated_at: "2026-04-18T07:00:00.000Z",
          } as GmailTransactionReviewRecord;
          reviewRecords.set(nextRecord.gmail_message_id, nextRecord);
          updatedRecords.push(nextRecord);
        }
      }

      return {
        data: updatedRecords,
        error: null,
      };
    };

    return {
      eq: (column: string, value: string) => {
        assert.equal(column, "id");
        return Promise.resolve(execute([value]));
      },
      in: (column: string, values: string[]) => {
        assert.equal(column, "id");
        return Promise.resolve(execute(values));
      },
    };
  }

  return {
    records,
    reviewRecords,
    supabase: {
      rpc: async (functionName: string, payload: Record<string, unknown>) => {
        assert.equal(functionName, "ingest_gmail_transaction");

        return {
          data: createTransactionRecord(payload),
          error: null,
        };
      },
      from: (tableName: string) => ({
        select: () => createSelectQuery(tableName),
        upsert: (rows: Array<Record<string, unknown>>) => ({
          select: async () => ({
            data: rows.map(createReviewRecord),
            error: null,
          }),
        }),
        update: (payload: Record<string, unknown>) => createUpdateQuery(payload),
      }),
    },
  };
}

function createExistingTransactionRecord(
  overrides: Partial<TransactionRecord> = {}
): TransactionRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    source: "manual",
    direction: "expense",
    amount: 199.99,
    currency_code: "PHP",
    bank_name: "GCash",
    merchant: "Old Merchant",
    description: "Original description",
    category: "uncategorized",
    reference_number: "REF-123",
    notes: null,
    status: "completed",
    happened_at: "2026-04-18T06:13:21.000Z",
    created_at: "2026-04-18T06:13:21.000Z",
    updated_at: "2026-04-18T06:13:21.000Z",
    gmail_message_id: null,
    gmail_thread_id: null,
    ...overrides,
  };
}

function createSupabaseUpdateStub(initialRecord: TransactionRecord) {
  let storedRecord = initialRecord;

  return {
    getRecord: () => storedRecord,
    supabase: {
      from: (tableName: string) => {
        assert.equal(tableName, "transactions");

        return {
          update: (payload: { merchant: string; category: string; notes: string | null }) => ({
            eq: (column: string, value: string) => {
              assert.equal(column, "id");

              return {
                select: () => ({
                  maybeSingle: async () => {
                    if (value !== storedRecord.id) {
                      return {
                        data: null,
                        error: null,
                      };
                    }

                    storedRecord = {
                      ...storedRecord,
                      merchant: payload.merchant,
                      category: payload.category,
                      notes: payload.notes,
                      updated_at: "2026-04-18T07:00:00.000Z",
                    };

                    return {
                      data: storedRecord,
                      error: null,
                    };
                  },
                }),
              };
            },
          }),
        };
      },
    },
  };
}

beforeEach(() => {
  parsedTransactionsResult = createParsedTransactionsResult();
  fetchParsedGmailTransactionsMock.mock.resetCalls();
});

test("sync queues new Gmail rows, commit inserts selected rows, and full resync updates existing rows", async () => {
  const store = createSupabaseUpsertStub();

  const firstSync = await syncGmailTransactions(store.supabase as never, "user-1");

  assert.equal(firstSync.insertedCount, 0);
  assert.equal(firstSync.updatedCount, 0);
  assert.equal(firstSync.reviewItemCount, 1);
  assert.equal(store.records.size, 0);
  assert.equal(store.reviewRecords.size, 1);

  const commitResult = await commitGmailTransactionReview(store.supabase as never, "user-1", {
    reviewBatchId: firstSync.reviewBatchId,
    selectedReviewItemIds: [firstSync.reviewItems[0].id],
  });

  assert.equal(commitResult.confirmedCount, 1);
  assert.equal(commitResult.declinedCount, 0);
  assert.equal(store.records.size, 1);
  assert.equal(store.records.get("gmail-msg-1")?.reference_number, null);
  assert.equal(store.reviewRecords.get("gmail-msg-1")?.review_status, "confirmed");

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
  assert.equal(secondSync.reviewItemCount, 0);
  assert.equal(store.records.size, 1);
  assert.equal(store.records.get("gmail-msg-1")?.reference_number, "BC550000016798279517");
  assert.equal(fetchParsedGmailTransactionsMock.mock.calls.length, 2);
});

test("declined review rows are not shown again on later syncs", async () => {
  const store = createSupabaseUpsertStub();
  const firstSync = await syncGmailTransactions(store.supabase as never, "user-1");

  await commitGmailTransactionReview(store.supabase as never, "user-1", {
    reviewBatchId: firstSync.reviewBatchId,
    selectedReviewItemIds: [],
  });

  const secondSync = await syncGmailTransactions(store.supabase as never, "user-1");

  assert.equal(secondSync.reviewItemCount, 0);
  assert.equal(secondSync.declinedReviewItemCount, 1);
  assert.equal(store.records.size, 0);
  assert.equal(store.reviewRecords.get("gmail-msg-1")?.review_status, "declined");
});

test("updates only the editable transaction fields", async () => {
  const store = createSupabaseUpdateStub(createExistingTransactionRecord());

  const updatedTransaction = await updateTransactionEditableFields(
    store.supabase as never,
    "11111111-1111-4111-8111-111111111111",
    {
    merchant: "Updated Merchant",
    category: "food",
    notes: "Updated reconciliation note",
    }
  );

  assert.equal(updatedTransaction.merchant, "Updated Merchant");
  assert.equal(updatedTransaction.category, "food");
  assert.equal(updatedTransaction.notes, "Updated reconciliation note");
  assert.equal(updatedTransaction.description, "Original description");
  assert.equal(updatedTransaction.referenceNumber, "REF-123");
  assert.equal(store.getRecord().description, "Original description");
  assert.equal(store.getRecord().reference_number, "REF-123");
});
