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

test("parses the visible MariBank reference number from the 2000 transfer email body", () => {
  const message: GmailMessageDetail = {
    id: "maribank-message-2000",
    threadId: "thread-2000",
    snippet: "Successful MariBank Transfer",
    internalDate: String(Date.parse("2026-04-02T12:44:00+08:00")),
    payload: {
      mimeType: "text/plain",
      headers: [
        {
          name: "Subject",
          value: "Successful MariBank Transfer",
        },
        {
          name: "From",
          value: "MariBank PH Alerts <alerts@maribank.com.ph>",
        },
      ],
      body: {
        data: encodeBase64Url([
          "Hi JAMES FANUEL DAMASO,",
          "",
          "Your transfer of PHP2,000.00 is successful.",
          "",
          "Transfer from: JAMES FANUEL DAMASO - 0860",
          "Transfer to: MariBank - 1172",
          "Transfer amount: PHP2,000.00",
          "Reference No: BC550000016659195123",
        ].join("\n")),
      },
    },
  };

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "MariBank");
  assert.equal(result.transaction.referenceNumber, "BC550000016659195123");
});

test("maps Move It booking ids into the transaction reference when the text is present in the body", () => {
  const message: GmailMessageDetail = {
    id: "moveit-message-1",
    threadId: "moveit-thread-1",
    snippet: "Your Move It E-Receipt",
    internalDate: String(Date.parse("2026-03-24T13:45:00+08:00")),
    payload: {
      mimeType: "text/plain",
      headers: [
        {
          name: "Subject",
          value: "Your Move It E-Receipt",
        },
        {
          name: "From",
          value: "Move It <no-reply@moveit.com.ph>",
        },
      ],
      body: {
        data: encodeBase64Url([
          "Hope you enjoyed your ride!",
          "Picked up on 24 March 2026",
          "Booking ID: A-94PHP40GWASUAV",
          "",
          "Total Paid P 37.00",
          "Fare 37.00",
          "Paid by GCash 37.00",
        ].join("\n")),
      },
    },
  };

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "GCash");
  assert.equal(result.transaction.referenceNumber, "A-94PHP40GWASUAV");
});
