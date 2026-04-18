import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";

import type { GmailMessageDetail } from "@/lib/gmail/client";

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createMariBankMessage(messageId: string, referenceNumber: string): GmailMessageDetail {
  return {
    id: messageId,
    threadId: `${messageId}-thread`,
    snippet: "Successful MariBank Transfer",
    internalDate: String(Date.parse("2026-04-18T14:13:21+08:00")),
    payload: {
      mimeType: "text/plain",
      headers: [
        {
          name: "Subject",
          value: "Successful MariBank Transfer",
        },
        {
          name: "From",
          value: "MariBank Philippines <notifications@maribank.ph>",
        },
      ],
      body: {
        data: encodeBase64Url(
          `Successful MariBank Transfer\nTransfer amount: PHP 150.00\nReference No: ${referenceNumber}`
        ),
      },
    },
  };
}

let listedMessages = [
  { id: "existing-msg", threadId: "thread-existing" },
  { id: "new-msg", threadId: "thread-new" },
];
let messageDetails = new Map<string, GmailMessageDetail>();
let existingMessageIds = new Set<string>();
let ledgerHasTransactions = true;

const listGmailMessagesMock = mock.fn(async () => ({
  messages: listedMessages,
  nextPageToken: null,
  resultSizeEstimate: listedMessages.length,
}));
const getGmailMessageMock = mock.fn(async (_accessToken: string, messageId: string) => {
  const detail = messageDetails.get(messageId);
  if (!detail) {
    throw new Error(`Missing test Gmail message detail for ${messageId}`);
  }

  return detail;
});
const getValidGmailAccessTokenMock = mock.fn(async () => ({
  connection: {
    id: "gmail-connection-1",
    lastSyncedAt: null,
  },
  accessToken: "test-access-token",
}));
const markGmailConnectionSyncedMock = mock.fn(async () => undefined);
const getGmailEnvMock = mock.fn(() => ({}));

await mock.module("@/lib/gmail/client", {
  namedExports: {
    listGmailMessages: listGmailMessagesMock,
    getGmailMessage: getGmailMessageMock,
  },
});
await mock.module("@/features/gmail/services/gmail-connection.service", {
  namedExports: {
    getValidGmailAccessToken: getValidGmailAccessTokenMock,
    markGmailConnectionSynced: markGmailConnectionSyncedMock,
  },
});
await mock.module("@/lib/gmail/config", {
  namedExports: {
    getGmailEnv: getGmailEnvMock,
  },
});

const { fetchParsedGmailTransactions } = await import("@/features/transactions/services/gmail-sync.service");

function createSupabaseStub() {
  return {
    from(tableName: string) {
      assert.equal(tableName, "transactions");

      return {
        select(selection: string) {
          if (selection === "id") {
            return {
              limit: async () => ({
                data: ledgerHasTransactions ? [{ id: "txn-1" }] : [],
                error: null,
              }),
            };
          }

          if (selection === "gmail_message_id") {
            return {
              in: async (_columnName: string, messageIds: string[]) => ({
                data: messageIds
                  .filter((messageId) => existingMessageIds.has(messageId))
                  .map((messageId) => ({ gmail_message_id: messageId })),
                error: null,
              }),
            };
          }

          throw new Error(`Unexpected selection requested in test: ${selection}`);
        },
      };
    },
  };
}

beforeEach(() => {
  listedMessages = [
    { id: "existing-msg", threadId: "thread-existing" },
    { id: "new-msg", threadId: "thread-new" },
  ];
  messageDetails = new Map([
    ["existing-msg", createMariBankMessage("existing-msg", "BC550000016658898435")],
    ["new-msg", createMariBankMessage("new-msg", "BC550000016798279517")],
  ]);
  existingMessageIds = new Set(["existing-msg"]);
  ledgerHasTransactions = true;
  listGmailMessagesMock.mock.resetCalls();
  getGmailMessageMock.mock.resetCalls();
  getValidGmailAccessTokenMock.mock.resetCalls();
  markGmailConnectionSyncedMock.mock.resetCalls();
  getGmailEnvMock.mock.resetCalls();
});

test("regular sync skips Gmail messages that were already imported", async () => {
  const result = await fetchParsedGmailTransactions(createSupabaseStub() as never, "user-1", {
    daysBack: 30,
  });

  assert.equal(result.matchedMessageCount, 2);
  assert.equal(result.existingMessageCount, 1);
  assert.equal(result.parsedExistingMessageCount, 0);
  assert.equal(result.parsedTransactions.length, 1);
  assert.equal(result.parsedTransactions[0]?.gmailMessageId, "new-msg");
  assert.equal(getGmailMessageMock.mock.calls.length, 1);
  assert.deepEqual(getGmailMessageMock.mock.calls[0]?.arguments, ["test-access-token", "new-msg"]);
  assert.equal(markGmailConnectionSyncedMock.mock.calls.length, 1);
});

test("full resync reparses existing Gmail messages so they can be backfilled", async () => {
  const result = await fetchParsedGmailTransactions(createSupabaseStub() as never, "user-1", {
    daysBack: 365,
    reprocessExisting: true,
  });

  assert.equal(result.matchedMessageCount, 2);
  assert.equal(result.existingMessageCount, 1);
  assert.equal(result.parsedExistingMessageCount, 1);
  assert.equal(result.parsedTransactions.length, 2);
  assert.equal(getGmailMessageMock.mock.calls.length, 2);
  assert.deepEqual(
    getGmailMessageMock.mock.calls.map((call) => call.arguments[1]),
    ["existing-msg", "new-msg"]
  );
});
