import type { GmailMessageDetail } from "@/lib/gmail/client";
import { supportedBanks } from "@/features/transactions/constants/transaction.constants";
import type {
  GmailPaymentEmailParseResult,
  ParsedGmailTransaction,
} from "@/features/transactions/types/Transaction";
import { categorizeTransaction } from "@/features/transactions/utils/categorizeTransaction";
import { extractReferenceNumber } from "@/features/transactions/utils/extractReferenceNumber";

const bankAliases = [
  { bankName: "BDO", aliases: ["bdo", "banco de oro"] },
  { bankName: "BPI", aliases: ["bpi", "bank of the philippine islands"] },
  { bankName: "UnionBank", aliases: ["unionbank", "union bank"] },
  { bankName: "Metrobank", aliases: ["metrobank", "metropolitan bank"] },
  { bankName: "Security Bank", aliases: ["security bank", "securitybank"] },
  { bankName: "Landbank", aliases: ["landbank", "land bank"] },
  { bankName: "PNB", aliases: ["pnb", "philippine national bank"] },
  { bankName: "EastWest Bank", aliases: ["eastwest", "east west"] },
  { bankName: "RCBC", aliases: ["rcbc"] },
  { bankName: "Chinabank", aliases: ["chinabank", "china bank"] },
  { bankName: "PSBank", aliases: ["psbank", "ps bank"] },
  { bankName: "AUB", aliases: ["aub", "asia united bank"] },
  { bankName: "GCash", aliases: ["gcash"] },
  { bankName: "Maya", aliases: ["maya", "paymaya"] },
  { bankName: "ShopeePay", aliases: ["shopeepay", "shopee pay"] },
  { bankName: "Coins.ph", aliases: ["coins.ph", "coins ph"] },
  { bankName: "Tonik", aliases: ["tonik"] },
  { bankName: "GoTyme", aliases: ["gotyme", "go tyme"] },
  { bankName: "SeaBank", aliases: ["seabank", "sea bank"] },
  { bankName: "MariBank", aliases: ["maribank", "mari bank"] },
  { bankName: "OwnBank", aliases: ["ownbank", "own bank"] },
  { bankName: "CIMB", aliases: ["cimb"] },
  { bankName: "ING Philippines", aliases: ["ing philippines", "ing"] },
  { bankName: "Wise", aliases: ["wise"] },
  { bankName: "Payoneer", aliases: ["payoneer"] },
  { bankName: "Revolut", aliases: ["revolut"] },
] as const satisfies Array<{
  bankName: typeof supportedBanks[number];
  aliases: string[];
}>;

function decodeBase64Url(value?: string) {
  if (!value) {
    return "";
  }

  try {
    return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|td|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function findBodyData(
  parts?: GmailMessageDetail["payload"] extends infer T
    ? T extends { parts?: infer Parts }
      ? Parts
      : never
    : never
): string | undefined {
  let htmlCandidate: string | undefined;

  for (const part of parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return part.body.data;
    }

    if (!htmlCandidate && part.mimeType === "text/html" && part.body?.data) {
      htmlCandidate = part.body.data;
    }

    if (part.parts?.length) {
      const nested = findBodyData(part.parts);
      if (nested) {
        return nested;
      }
    }
  }

  return htmlCandidate;
}

function getHeaderValue(
  message: GmailMessageDetail,
  headerName: string
) {
  return message.payload?.headers?.find(
    (header) => header.name?.toLowerCase() === headerName.toLowerCase()
  )?.value;
}

function inferCurrencyCode(content: string) {
  if (/(?:\bUSD\b|\$)/i.test(content)) {
    return "USD" as const;
  }

  return "PHP" as const;
}

function parseNumericAmount(value: string) {
  return Number(value.replaceAll(",", ""));
}

function extractAmountFromMatch(
  match: RegExpMatchArray | null,
  fallbackCurrencyCode: "PHP" | "USD"
) {
  if (!match?.[1]) {
    return null;
  }

  const amount = parseNumericAmount(match[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    currencyCode:
      match[2]?.toUpperCase() === "USD"
        ? ("USD" as const)
        : fallbackCurrencyCode,
    amount,
  };
}

function parseCurrencyAndAmount(content: string) {
  const inferredCurrencyCode = inferCurrencyCode(content);
  const labeledAmountMatchers = [
    /(?:total amount|total paid|total payment|grand total)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
    /(?:amount(?: paid| due)?|payment amount|purchase amount|transaction amount|transfer amount|received amount|credited amount|debited amount)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
    /(?:payment received|payment sent|you paid|you sent|money received|received|credited|debited)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
  ];

  for (const pattern of labeledAmountMatchers) {
    const parsedAmount = extractAmountFromMatch(content.match(pattern), inferredCurrencyCode);
    if (parsedAmount) {
      return parsedAmount;
    }
  }

  const explicitCurrencyMatchers = [
    {
      currencyCode: "PHP" as const,
      patterns: [
        /(?:(?:PHP)(?=\s*[0-9])|₱|\bP(?=\s?\d))\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
        /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:\bPHP\b|₱|pesos?\b)/i,
      ],
    },
    {
      currencyCode: "USD" as const,
      patterns: [
        /(?:(?:USD)(?=\s*[0-9])|\$)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
        /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*\bUSD\b/i,
      ],
    },
  ];

  for (const matcher of explicitCurrencyMatchers) {
    for (const pattern of matcher.patterns) {
      const match = content.match(pattern);
      if (match?.[1]) {
        const amount = parseNumericAmount(match[1]);

        if (Number.isFinite(amount) && amount > 0) {
          return {
            currencyCode: matcher.currencyCode,
            amount,
          };
        }
      }
    }
  }

  return null;
}

function parseDirection(content: string) {
  const transferFromValue =
    content.match(/(?:transfer from|from account|source account)\s*[:#-]?\s*([^\n\r]+)/i)?.[1]?.trim() ??
    null;
  const transferToValue =
    content.match(/(?:transfer to|to account|destination account)\s*[:#-]?\s*([^\n\r]+)/i)?.[1]?.trim() ??
    null;

  if (
    /(received|credited|deposit|incoming|salary|payroll|money received|transfer received|received in (?:your|my) account|transferred to (?:your|my) account|transferred to account|credited to (?:your|my) account|posted to (?:your|my) account)/i.test(
      content
    )
  ) {
    return "income" as const;
  }

  if (
    /\byour transfer\b|transfer sent|successful transfer to|you sent|sent to\b|outgoing transfer/i.test(
      content
    )
  ) {
    return "transfer" as const;
  }

  if (
    transferToValue &&
    /(?:your|my)\s+(?:account|wallet)|to me\b|to myself\b/i.test(transferToValue)
  ) {
    return "income" as const;
  }

  if (
    transferFromValue &&
    /(?:your|my)\s+(?:account|wallet)|from me\b|from myself\b/i.test(transferFromValue)
  ) {
    return "transfer" as const;
  }

  if (/(transfer to|transferred to|instapay|pesonet|wallet top-up|fund transfer|bank transfer)/i.test(content)) {
    return "transfer" as const;
  }

  if (/(paid|purchase|charged|debited|payment successful|spent)/i.test(content)) {
    return "expense" as const;
  }

  return "expense" as const;
}

function looksLikeTransactionNotification(content: string) {
  return /(payment|receipt|transaction|invoice|order|transfer|received|credited|debited|deposit|purchase|fund transfer|paid|spent|money received)/i.test(
    content
  );
}

function isNonPostedPaymentNotice(content: string) {
  return /(?:payment (?:was )?declined|payment declined|declined\.)|(?:payment (?:was )?failed|payment failed)|(?:amount due)|(?:update your payment method)|(?:use a different one)|(?:we'll try to process the payment again)|(?:retry payment)|(?:past due)|(?:subscription (?:payment )?failed)|(?:could not process your payment)|(?:unable to process payment)|(?:payment unsuccessful)|(?:unsuccessful payment)|(?:failed to charge)|(?:charge failed)/i.test(
    content
  );
}

function parseBankName(content: string, from: string) {
  const haystack = `${content}\n${from}`.toLowerCase();

  for (const matcher of bankAliases) {
    if (matcher.aliases.some((alias) => haystack.includes(alias))) {
      return matcher.bankName;
    }
  }

  return supportedBanks.find((bankName) => haystack.includes(bankName.toLowerCase())) ?? "GCash";
}

function parseSenderLabel(from: string) {
  const displayNameMatch = from.match(/"?([^"<]+)"?\s*</);
  if (displayNameMatch?.[1]) {
    return displayNameMatch[1].trim();
  }

  const emailMatch = from.match(/([A-Z0-9._%+-]+)@/i);
  if (emailMatch?.[1]) {
    return emailMatch[1].replace(/[._-]+/g, " ").trim();
  }

  return null;
}

function parseMerchant(content: string, from: string) {
  const labeledMatch = content.match(/(?:merchant|biller|payee|recipient|store)\s*[:#-]?\s*([^\n\r]+)/i);
  if (labeledMatch?.[1]) {
    return labeledMatch[1].trim().slice(0, 160);
  }

  const receivedFromMatch = content.match(/(?:from)\s+([A-Za-z0-9&.,' -]{3,80})/i);
  if (receivedFromMatch?.[1] && !/no reply|noreply|support/i.test(receivedFromMatch[1])) {
    return receivedFromMatch[1].trim().slice(0, 160);
  }

  const toMatch = content.match(/(?:to|at)\s+([A-Za-z0-9&.,' -]{3,80})/i);
  if (toMatch?.[1]) {
    return toMatch[1].trim().slice(0, 160);
  }

  return parseSenderLabel(from)?.slice(0, 160) ?? "Payment Notification";
}

function createSkippedResult(
  message: GmailMessageDetail,
  subject: string,
  from: string,
  reason: string
): GmailPaymentEmailParseResult {
  return {
    kind: "skipped",
    skippedMessage: {
      gmailMessageId: message.id,
      subject: subject.trim() || "(No subject)",
      from: from.trim() || "Unknown sender",
      reason,
    },
  };
}

export function parseGmailPaymentEmail(message: GmailMessageDetail): GmailPaymentEmailParseResult {
  const subject = getHeaderValue(message, "Subject") ?? "";
  const from = getHeaderValue(message, "From") ?? "";
  const bodyData =
    message.payload?.body?.data ??
    findBodyData(message.payload?.parts);
  const decodedBody = decodeBase64Url(bodyData);
  const body =
    message.payload?.mimeType === "text/html" || /<\/?[a-z][\s\S]*>/i.test(decodedBody)
      ? stripHtml(decodedBody)
      : decodedBody;
  const combined = [subject, from, message.snippet ?? "", body].filter(Boolean).join("\n");

  if (combined.trim().length === 0) {
    return createSkippedResult(message, subject, from, "Message body could not be read.");
  }

  if (!looksLikeTransactionNotification(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message did not look like a payment or transfer notification."
    );
  }

  if (isNonPostedPaymentNotice(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message was a failed, declined, or billing reminder notice instead of a posted transaction."
    );
  }

  const parsedAmount = parseCurrencyAndAmount(combined);
  if (!parsedAmount) {
    return createSkippedResult(message, subject, from, "No supported payment amount was detected.");
  }

  if (!Number.isFinite(parsedAmount.amount) || parsedAmount.amount <= 0) {
    return createSkippedResult(message, subject, from, "Detected amount was invalid.");
  }

  const direction = parseDirection(combined);
  const merchant = parseMerchant(combined, from);
  const description = subject.trim().length > 0 ? subject.trim().slice(0, 160) : merchant;
  const category = categorizeTransaction({
    merchant,
    description,
    direction,
  });

  const transaction: ParsedGmailTransaction = {
    source: "gmail",
    direction,
    amount: parsedAmount.amount,
    currencyCode: parsedAmount.currencyCode,
    bankName: parseBankName(combined, from),
    merchant,
    description,
    category,
    referenceNumber: extractReferenceNumber(combined),
    status: /pending/i.test(combined) ? ("pending" as const) : ("completed" as const),
    happenedAt: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
    gmailMessageId: message.id,
    gmailThreadId: message.threadId ?? null,
    rawPayload: {
      snippet: message.snippet ?? null,
      subject,
      from,
    },
  };

  return {
    kind: "parsed",
    transaction,
  };
}
