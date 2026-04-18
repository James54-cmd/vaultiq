import assert from "node:assert/strict";
import { test } from "node:test";

import type { GmailMessageDetail } from "@/lib/gmail/client";
import { parseGmailPaymentEmail } from "@/features/transactions/utils/parseGmailPaymentEmail";

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test("parses reference numbers from multipart Gmail bodies when only the HTML part contains the ref", () => {
  const message: GmailMessageDetail = {
    id: "maribank-message-1",
    threadId: "thread-1",
    snippet: "Successful MariBank Transfer",
    internalDate: String(Date.parse("2026-04-18T14:13:21+08:00")),
    payload: {
      mimeType: "multipart/alternative",
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
      parts: [
        {
          mimeType: "text/plain",
          body: {
            data: encodeBase64Url("Successful MariBank Transfer\nTransfer amount: PHP 150.00"),
          },
        },
        {
          mimeType: "text/html",
          body: {
            data: encodeBase64Url(`
              <div>Successful MariBank Transfer</div>
              <div>Transfer amount: PHP 150.00</div>
              <div>Reference No</div>
              <div>BC550000016798279517</div>
            `),
          },
        },
      ],
    },
  };

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "MariBank");
  assert.equal(result.transaction.direction, "transfer");
  assert.equal(result.transaction.amount, 150);
  assert.equal(result.transaction.referenceNumber, "BC550000016798279517");
});
