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
  { bankName: "Atome", aliases: ["atome", "atome card"] },
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

function normalizeMultilineText(value: string) {
  const lines = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim());
  const normalizedLines: string[] = [];
  let previousLineBlank = false;

  for (const line of lines) {
    if (line.length === 0) {
      if (!previousLineBlank && normalizedLines.length > 0) {
        normalizedLines.push("");
      }

      previousLineBlank = true;
      continue;
    }

    normalizedLines.push(line);
    previousLineBlank = false;
  }

  return normalizedLines.join("\n").trim();
}

function stripHtml(value: string) {
  return normalizeMultilineText(
    decodeHtmlEntities(
      value
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|tr|td|th|table|section|article|header|footer|h\d)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

type GmailPayloadPart = NonNullable<GmailMessageDetail["payload"]>;

function collectBodyDataParts(
  part: GmailPayloadPart | NonNullable<GmailPayloadPart["parts"]>[number] | undefined,
  segments: Array<{ mimeType: string; data: string }>
) {
  if (!part) {
    return;
  }

  if (
    part.body?.data &&
    (part.mimeType === "text/plain" || part.mimeType === "text/html")
  ) {
    segments.push({
      mimeType: part.mimeType,
      data: part.body.data,
    });
  }

  for (const nestedPart of part.parts ?? []) {
    collectBodyDataParts(nestedPart, segments);
  }
}

function parseMessageBody(message: GmailMessageDetail) {
  const segments: Array<{ mimeType: string; data: string }> = [];
  collectBodyDataParts(message.payload, segments);

  if (segments.length === 0 && message.payload?.body?.data) {
    segments.push({
      mimeType: message.payload.mimeType ?? "text/plain",
      data: message.payload.body.data,
    });
  }

  const normalizedSegments = Array.from(
    new Set(
      segments
        .map(({ mimeType, data }) => {
          const decoded = decodeBase64Url(data);
          if (!decoded) {
            return "";
          }

          if (mimeType === "text/html" || /<\/?[a-z][\s\S]*>/i.test(decoded)) {
            return stripHtml(decoded);
          }

          return normalizeMultilineText(decoded);
        })
        .filter((segment) => segment.length > 0)
    )
  );

  return normalizedSegments.join("\n");
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

const labeledAmountMatchers = [
  /(?:total amount|total paid|total payment|grand total)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
  /(?:amount(?: paid| due)?|payment amount|purchase amount|transaction amount|transfer amount|received amount|credited amount|debited amount)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
  /(?:payment received|payment sent|you paid|you sent|money received|received|credited|debited)\s*(?:is|was|:|=|-)?\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?:\s*(PHP|USD))?/i,
] as const;

const postedTransactionSignalPatterns = [
  /(?:payment (?:successful|succeeded|completed|confirmed|received|posted))/i,
  /(?:payment of\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?.{0,120}successfully processed)/i,
  /(?:transaction (?:successful|completed|posted))/i,
  /(?:transaction.{0,120}successfully processed)/i,
  /(?:transfer (?:successful|completed|received|sent))/i,
  /\btransfer\b[\s\S]{0,80}\b(?:is|was)\s+(?:successful|completed|confirmed)\b/i,
  /(?:money received)|(?:received amount)|(?:credited amount)|(?:debited amount)/i,
  /(?:has been debited)|(?:was debited)|(?:has been credited)|(?:was credited)/i,
  /(?:deposit (?:successful|received|completed))|(?:cash in (?:successful|received))|(?:cash out (?:successful|completed))/i,
  /(?:you paid)|(?:you sent)|(?:paid (?:with|via|using|by))/i,
  /(?:official receipt)|(?:purchase receipt)|(?:transaction receipt)|(?:e-?receipt)|(?:receipt number)/i,
  /(?:order (?:has been )?paid)|(?:refund (?:successful|completed|processed|issued|received))/i,
  /(?:total amount|total paid|total payment|grand total|payment amount|purchase amount|transaction amount|transfer amount)\b/i,
] as const;

const hardSkipAdvisoryOrPromotionalPrimaryPatterns = [
  /important advisory/i,
  /\bbsp regulation\b/i,
  /large-?value cash transactions/i,
  /pre-?qualified/i,
  /credit card/i,
  /\bmailbox\b/i,
  /request via mailbox/i,
  /account inquiry/i,
  /settle bills automatically/i,
  /automatic payments?/i,
] as const;

const hardSkipAdvisoryOrPromotionalSupportPatterns = [
  /\bcircular\b/i,
  /no annual fee/i,
  /\bpoints\b/i,
  /exclusive offer/i,
  /valued account holder/i,
  /no documents required/i,
  /view this email as a web page/i,
  /\bgo here\b/i,
  /learn more/i,
  /unsubscribe/i,
  /free of charge/i,
  /pre-?enrolled billers/i,
] as const;

const genericPromotionalOfferPatterns = [
  /buy now/i,
  /shop now/i,
  /special offer/i,
  /limited time/i,
  /promo(?:tion| code)?/i,
  /apply (?:now|today|in just a few steps)/i,
  /fee for life/i,
] as const;

const genericPromotionalSupportPatterns = [
  /sale price/i,
  /regular price/i,
  /save (?:on|up to)/i,
  /view in browser/i,
  /explore\b/i,
  /first transaction/i,
] as const;

const disallowedMerchantCandidatePatterns = [
  /view this email/i,
  /web page/i,
  /\bgo here\b/i,
  /learn more/i,
  /unsubscribe/i,
  /important advisory/i,
  /pre-?qualified/i,
  /valued account holder/i,
  /\bmailbox\b/i,
  /automatic payments?/i,
  /free of charge/i,
] as const;

function parseCurrencyAndAmount(content: string) {
  const inferredCurrencyCode = inferCurrencyCode(content);
  for (const pattern of labeledAmountMatchers) {
    const parsedAmount = extractAmountFromMatch(content.match(pattern), inferredCurrencyCode);
    if (parsedAmount) {
      return parsedAmount;
    }
  }

  if (!hasPostedTransactionSignal(content) || hasNonTransactionAmountContext(content)) {
    return null;
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

function countPatternMatches(content: string, patterns: readonly RegExp[]) {
  return patterns.reduce((count, pattern) => count + (pattern.test(content) ? 1 : 0), 0);
}

function hasAnyPatternMatch(content: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(content));
}

function hasCompletedRefundSignal(content: string) {
  return /(?:refund (?:has been )?(?:processed|completed|successful|issued|sent|received))|(?:refund (?:amount|credit))|(?:credited back)|(?:returned to your account)|(?:reversal (?:completed|processed))|(?:cashback received)/i.test(
    content
  );
}

function hasPostedTransactionSignal(content: string) {
  return postedTransactionSignalPatterns.some((pattern) => pattern.test(content));
}

function hasNonTransactionAmountContext(content: string) {
  return /(?:bsp regulation|circular|large-?value cash transactions|threshold|spend required|minimum spend|required spend|no annual fee|fee for life|valued account holder|credit card|pre-?qualified|points|billers?|pre-?enrolled|every\s+[0-9]{1,2}(?:st|nd|rd|th)|automatic payments?|settle bills automatically|mailbox)/i.test(
    content
  );
}

function parseDirection(content: string) {
  const transferFromValue =
    content.match(/(?:transfer from|from account|source account)\s*[:#-]?\s*([^\n\r]+)/i)?.[1]?.trim() ??
    null;
  const transferToValue =
    content.match(/(?:transfer to|to account|destination account)\s*[:#-]?\s*([^\n\r]+)/i)?.[1]?.trim() ??
    null;

  if (hasCompletedRefundSignal(content)) {
    return "income" as const;
  }

  if (
    /(received|credited|deposit|incoming|salary|payroll|money received|transfer received|refund received|refund credited|received in (?:your|my) account|transferred to (?:your|my) account|transferred to account|credited to (?:your|my) account|posted to (?:your|my) account)/i.test(
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

  if (/(you paid|paid with|paid via|paid using|purchase (?:receipt|amount|successful)|charged|debited|payment successful|payment completed|spent)/i.test(content)) {
    return "expense" as const;
  }

  return "expense" as const;
}

function looksLikeTransactionNotification(content: string) {
  return /(payment|receipt|transaction|invoice|transfer|received|credited|debited|deposit|fund transfer|paid|spent|money received|refund)/i.test(
    content
  ) || (/\border\b/i.test(content) && hasPostedTransactionSignal(content));
}

function isNonPostedPaymentNotice(content: string) {
  return /(?:payment (?:was )?declined|payment declined|declined\.)|(?:payment (?:was )?failed|payment failed)|(?:amount due)|(?:update your payment method)|(?:use a different one)|(?:we'll try to process the payment again)|(?:retry payment)|(?:past due)|(?:subscription (?:payment )?failed)|(?:could not process your payment)|(?:unable to process payment)|(?:payment unsuccessful)|(?:unsuccessful payment)|(?:failed to charge)|(?:charge failed)/i.test(
    content
  );
}

function isCancelledOrderOrPaymentNotice(content: string) {
  return /(?:order|payment|transaction|delivery|shipment).{0,80}(?:cancelled|canceled|voided)|(?:has been cancelled)|(?:has been canceled)|(?:did not manage to deliver)|(?:delivery (?:was )?unsuccessful)|(?:order cancellation)|(?:order was cancelled)|(?:order was canceled)|(?:payment (?:was )?reversed)|(?:transaction (?:was )?reversed)|(?:void transaction)/i.test(
    content
  ) && !hasCompletedRefundSignal(content);
}

function isOrderLifecycleNotice(content: string) {
  return /(?:order details)|(?:order id)|(?:seller\s*:)|(?:tracking number)|(?:parcel)|(?:delivery update)|(?:shipment update)|(?:out for delivery)|(?:has shipped)|(?:has been shipped)|(?:delivered)|(?:your order)|(?:order status)/i.test(
    content
  );
}

function isPromotionalEmail(content: string) {
  if (hasPostedTransactionSignal(content)) {
    return false;
  }

  const offerSignalCount = countPatternMatches(content, genericPromotionalOfferPatterns);
  const supportSignalCount = countPatternMatches(content, genericPromotionalSupportPatterns);

  return offerSignalCount >= 2 || (offerSignalCount >= 1 && supportSignalCount >= 1);
}

function isAdvisoryOrPromotionalBankEmail(content: string) {
  if (hasPostedTransactionSignal(content)) {
    return false;
  }

  const primarySignalCount = countPatternMatches(
    content,
    hardSkipAdvisoryOrPromotionalPrimaryPatterns
  );
  const supportSignalCount = countPatternMatches(
    content,
    hardSkipAdvisoryOrPromotionalSupportPatterns
  );

  return (
    primarySignalCount >= 2 ||
    (primarySignalCount >= 1 && supportSignalCount >= 1) ||
    (hasAnyPatternMatch(content, [/important advisory/i, /pre-?qualified/i]) &&
      hasAnyPatternMatch(content, [/learn more/i, /unsubscribe/i, /\bgo here\b/i]))
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

function sanitizeMerchantCandidate(value: string | null | undefined) {
  const normalized = value?.replace(/[ \t]+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  if (disallowedMerchantCandidatePatterns.some((pattern) => pattern.test(normalized))) {
    return null;
  }

  return normalized.slice(0, 160);
}

function parseMerchant(content: string, from: string) {
  const labeledMatch = content.match(/(?:merchant|biller|payee|recipient|store)\s*[:#-]?\s*([^\n\r]+)/i);
  const labeledMerchant = sanitizeMerchantCandidate(labeledMatch?.[1]);
  if (labeledMerchant) {
    return labeledMerchant;
  }

  const paymentForMatch = content.match(
    /(?:payment of\s*(?:(?:PHP|USD)(?=\s*[0-9])|₱|\$|\bP(?=\s?\d))?\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?\s+for\s+)([A-Za-z0-9&.,'()\/ -]{3,120}?)(?=\s+using\s+(?:your|the)\b|\s+has been\b|\s+was\b|[.\n\r])/i
  );
  const paymentForMerchant = sanitizeMerchantCandidate(paymentForMatch?.[1]);
  if (paymentForMerchant) {
    return paymentForMerchant;
  }

  const receivedFromMatch = content.match(/(?:from)\s+([A-Za-z0-9&.,' -]{3,80})/i);
  if (receivedFromMatch?.[1] && !/no reply|noreply|support/i.test(receivedFromMatch[1])) {
    const receivedFromMerchant = sanitizeMerchantCandidate(receivedFromMatch[1]);
    if (receivedFromMerchant) {
      return receivedFromMerchant;
    }
  }

  const toMatch = content.match(/(?:to|at)\s+([A-Za-z0-9&.,' -]{3,80})/i);
  const toMerchant = sanitizeMerchantCandidate(toMatch?.[1]);
  if (toMerchant) {
    return toMerchant;
  }

  return sanitizeMerchantCandidate(parseSenderLabel(from)) ?? "Payment Notification";
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
  const body = parseMessageBody(message);
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

  if (isPromotionalEmail(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message looked like a promotional or marketing email instead of a posted transaction."
    );
  }

  if (isAdvisoryOrPromotionalBankEmail(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message looked like a bank advisory, product offer, or marketing email instead of a posted transaction."
    );
  }

  if (isCancelledOrderOrPaymentNotice(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message was a cancelled, voided, or undelivered order notice instead of a posted expense."
    );
  }

  if (isOrderLifecycleNotice(combined) && !hasPostedTransactionSignal(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message was an order or delivery status update without proof of a completed payment."
    );
  }

  if (!hasPostedTransactionSignal(combined)) {
    return createSkippedResult(
      message,
      subject,
      from,
      "Message did not contain proof of a posted transaction."
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
