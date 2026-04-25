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

function createPlainTextMessage(input: {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  internalDate?: string;
}): GmailMessageDetail {
  return {
    id: input.id,
    threadId: input.threadId ?? `${input.id}-thread`,
    snippet: input.snippet,
    internalDate:
      input.internalDate ?? String(Date.parse("2026-04-19T12:00:00+08:00")),
    payload: {
      mimeType: "text/plain",
      headers: [
        {
          name: "Subject",
          value: input.subject,
        },
        {
          name: "From",
          value: input.from,
        },
      ],
      body: {
        data: encodeBase64Url(input.body),
      },
    },
  };
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
  assert.equal(result.transaction.direction, "expense");
  assert.equal(result.transaction.type, "expense");
  assert.equal(result.transaction.referenceNumber, "A-94PHP40GWASUAV");
});

test("parses GCash bills pay receipts as expenses instead of transfers", () => {
  const message = createPlainTextMessage({
    id: "gcash-bills-pay-nbi",
    subject: "Name NBI Total Amount PHP 160.00 Amount Paid PHP 160.00 Fee PHP 0.00",
    from: "GCash <no-reply@gcash.com>",
    snippet: "GCash Bills Pay Receipt",
    internalDate: String(Date.parse("2026-03-28T13:50:40+08:00")),
    body: [
      "GCash Bills Pay Receipt",
      "Name NBI Total Amount PHP 160.00 Amount Paid PHP 160.00 Fee PHP 0.00",
      "Account Number MP3WCVA6AY",
      "Date/Time 28 March 2026 01:50:40 PM",
      "GCash Ref. No. 229029263",
      "Email",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "GCash");
  assert.equal(result.transaction.direction, "expense");
  assert.equal(result.transaction.type, "expense");
  assert.equal(result.transaction.amount, 160);
  assert.equal(result.transaction.merchant, "NBI");
  assert.notEqual(result.transaction.category, "transfers");
  assert.equal(result.transaction.referenceNumber, "NO.229029263");
});

test("skips UnionBank Mailbox advisory emails that mention requests or inquiries", () => {
  const message = createPlainTextMessage({
    id: "unionbank-mailbox-advisory",
    subject: "📨 Send your UnionBank account inquiry or request via Mailbox",
    from: "UnionBank Advisory <sf.noreply@ub.unionbankph.com>",
    snippet:
      "Available 24/7 on UnionBank Online! To view this email as a web page, go here.",
    body: [
      "Available 24/7 on UnionBank Online!",
      "To view this email as a web page, go here.",
      "For a secure and more convenient way to reach us, use Mailbox to file transaction disputes,",
      "send your UnionBank account inquiry or request via Mailbox, and update your account details.",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "skipped");

  if (result.kind !== "skipped") {
    return;
  }

  assert.match(result.skippedMessage.reason, /advisory|marketing|posted transaction/i);
});

test("skips UnionBank BSP advisories even when they mention large currency thresholds", () => {
  const message = createPlainTextMessage({
    id: "unionbank-bsp-advisory",
    subject: "Important Advisory: New BSP Regulation on Large-Value Cash Transactions",
    from: "UnionBank Advisory <sf.noreply@ub.unionbankph.com>",
    snippet:
      "Important Advisory: New BSP Regulation on Large-Value Cash Transactions to comply with BSP Circular No. 1218.",
    body: [
      "Important Advisory: New BSP Regulation on Large-Value Cash Transactions",
      "To view this email as a web page, go here.",
      "To comply with BSP Circular No. 1218 (Series of 2025), cash transactions amounting to PHP 500,000.00",
      "and above may require additional information and documents.",
      "Learn more about the new regulation and updated threshold requirements.",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "skipped");
});

test("skips UnionBank pre-qualified credit card offers with points and fee promos", () => {
  const message = createPlainTextMessage({
    id: "unionbank-credit-card-offer",
    subject: "You're Pre-Qualified for a UnionBank Rewards Credit Card!",
    from: "UnionBank of the Philippines <sf.noreply@ub.unionbankph.com>",
    snippet:
      "To view this email as a web page, go here. Because you're a valued UnionBank Savings Accountholder, you can apply in just a few steps.",
    body: [
      "To view this email as a web page, go here.",
      "Because you're a valued UnionBank Savings Accountholder, you can apply for your UnionBank Rewards Credit Card in just a few steps.",
      "NO DOCUMENTS REQUIRED.",
      "Enjoy NO ANNUAL FEE FOR LIFE with FREE 10,000 points on your first transaction.",
      "This offer is exclusively for you and cannot be shared or transferred to anyone else.",
      "Unsubscribe",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "skipped");
});

test("skips UnionBank automatic bills promotions that contain form values and biller counts", () => {
  const message = createPlainTextMessage({
    id: "unionbank-auto-bills-promo",
    subject: "Settle bills automatically for free with UnionBank Online",
    from: "UnionBank Advisory <sf.noreply@ub.unionbankph.com>",
    snippet:
      "Settle bills automatically for free with UnionBank Online. Pay as many billers as you need to, free of charge!",
    body: [
      "Settle bills automatically for free with UnionBank Online.",
      "Payment Details",
      "3500",
      "Select Date",
      "EVERY 30TH",
      "Pay as many billers as you need to, free of charge!",
      "Get access to 800+ pre-enrolled billers including utilities, telco, cards, government, and others.",
      "No more Late Fees when you schedule automatic payments.",
      "Learn more",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "skipped");
});

test("still parses real posted UnionBank transfer notifications", () => {
  const message = createPlainTextMessage({
    id: "unionbank-transfer-posted",
    subject: "UnionBank Online: Funds Transfer Successful",
    from: "UnionBank Alerts <alerts@ub.unionbankph.com>",
    snippet: "Your transfer of PHP 1,250.00 is successful.",
    body: [
      "Your transfer of PHP 1,250.00 is successful.",
      "Transfer from: Savings Account - 1234",
      "Transfer to: Maria Santos",
      "Transfer amount: PHP 1,250.00",
      "Reference No: FT123456789",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "UnionBank");
  assert.equal(result.transaction.direction, "transfer");
  assert.equal(result.transaction.amount, 1250);
  assert.equal(result.transaction.referenceNumber, "FT123456789");
});

test("recognizes Atome as a supported provider for posted transaction emails", () => {
  const message = createPlainTextMessage({
    id: "atome-transaction-posted",
    subject: "Atome Card transaction posted",
    from: "Atome <no-reply@atome.ph>",
    snippet: "Transaction posted. Amount paid: PHP 999.00",
    body: [
      "Your Atome Card transaction posted successfully.",
      "Amount paid: PHP 999.00",
      "Merchant: Example Store",
      "Reference No: AT123456789",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "Atome");
  assert.equal(result.transaction.amount, 999);
  assert.equal(result.transaction.referenceNumber, "AT123456789");
});

test("parses the Atome sample email wording that says payment has been successfully processed", () => {
  const message = createPlainTextMessage({
    id: "atome-processed-payment",
    subject: "Your Atome Card payment was successfully processed",
    from: "Atome Card <no-reply@atome.ph>",
    snippet:
      "Your payment of ₱107.15 for COLONNADE SUPERMARKET CEBU PHL using your Atome Card ending in *8146 has been successfully processed.",
    body: [
      "We are pleased to inform you that your payment of ₱107.15 for COLONNADE SUPERMARKET CEBU PHL using your Atome Card ending in *8146 has been successfully processed.",
      "",
      "Thank you for using Atome.",
      "",
      "You can access your Loan Schedule Agreement via Atome App under Transaction Details once the transaction has been fully processed with the merchant.",
      "",
      "We look forward to serving you again in the future.",
      "Your friends at Atome Card",
    ].join("\n"),
  });

  const result = parseGmailPaymentEmail(message);

  assert.equal(result.kind, "parsed");

  if (result.kind !== "parsed") {
    return;
  }

  assert.equal(result.transaction.bankName, "Atome");
  assert.equal(result.transaction.amount, 107.15);
  assert.equal(result.transaction.merchant, "COLONNADE SUPERMARKET CEBU PHL");
  assert.equal(result.transaction.direction, "expense");
});
