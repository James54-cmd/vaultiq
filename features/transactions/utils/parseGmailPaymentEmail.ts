import type { GmailMessageDetail } from "@/lib/gmail/client";
import { supportedBanks } from "@/features/transactions/constants/transaction.constants";
import { categorizeTransaction } from "@/features/transactions/utils/categorizeTransaction";
import { extractReferenceNumber } from "@/features/transactions/utils/extractReferenceNumber";

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

function findBodyData(
  parts?: GmailMessageDetail["payload"] extends infer T
    ? T extends { parts?: infer Parts }
      ? Parts
      : never
    : never
): string | undefined {
  for (const part of parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return part.body.data;
    }

    if (part.parts?.length) {
      const nested = findBodyData(part.parts);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function getHeaderValue(
  message: GmailMessageDetail,
  headerName: string
) {
  return message.payload?.headers?.find(
    (header) => header.name?.toLowerCase() === headerName.toLowerCase()
  )?.value;
}

function parseCurrencyAndAmount(content: string) {
  const phpMatch = content.match(/(?:PHP|₱)\s?([0-9][0-9,]*\.?\d{0,2})/i);
  if (phpMatch?.[1]) {
    return {
      currencyCode: "PHP" as const,
      amount: Number(phpMatch[1].replaceAll(",", "")),
    };
  }

  const usdMatch = content.match(/(?:USD|\$)\s?([0-9][0-9,]*\.?\d{0,2})/i);
  if (usdMatch?.[1]) {
    return {
      currencyCode: "USD" as const,
      amount: Number(usdMatch[1].replaceAll(",", "")),
    };
  }

  return null;
}

function parseDirection(content: string) {
  if (/(received|credited|deposit|incoming)/i.test(content)) {
    return "income" as const;
  }

  if (/(transfer|instapay|pesonet)/i.test(content)) {
    return "transfer" as const;
  }

  return "expense" as const;
}

function parseBankName(content: string) {
  return supportedBanks.find((bankName) => content.toLowerCase().includes(bankName.toLowerCase())) ?? "GCash";
}

function parseMerchant(content: string) {
  const labeledMatch = content.match(/(?:merchant|biller|payee)\s*[:#-]?\s*([^\n\r]+)/i);
  if (labeledMatch?.[1]) {
    return labeledMatch[1].trim().slice(0, 160);
  }

  const toMatch = content.match(/(?:to|at)\s+([A-Za-z0-9&.,' -]{3,80})/i);
  if (toMatch?.[1]) {
    return toMatch[1].trim().slice(0, 160);
  }

  return "Payment Successful";
}

export function parseGmailPaymentEmail(message: GmailMessageDetail) {
  const subject = getHeaderValue(message, "Subject") ?? "";
  const from = getHeaderValue(message, "From") ?? "";
  const bodyData =
    message.payload?.body?.data ??
    findBodyData(message.payload?.parts);
  const body = decodeBase64Url(bodyData);
  const combined = [subject, from, message.snippet ?? "", body].filter(Boolean).join("\n");

  const parsedAmount = parseCurrencyAndAmount(combined);
  if (!parsedAmount) {
    return null;
  }

  const direction = parseDirection(combined);
  const merchant = parseMerchant(combined);
  const description = subject.trim().length > 0 ? subject.trim().slice(0, 160) : merchant;
  const category = categorizeTransaction({
    merchant,
    description,
    direction,
  });

  return {
    source: "gmail" as const,
    direction,
    amount: parsedAmount.amount,
    currencyCode: parsedAmount.currencyCode,
    bankName: parseBankName(combined),
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
}
