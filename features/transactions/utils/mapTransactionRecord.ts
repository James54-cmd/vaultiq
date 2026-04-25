import type { TransactionRecord } from "@/features/transactions/types/TransactionRecord";
import type { Transaction, TransactionStatus, TransactionType } from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { getBankInitials } from "@/features/transactions/utils/getBankInitials";
import { getSignedTransactionAmount } from "@/features/transactions/utils/getSignedTransactionAmount";

export type TransactionAccountDisplay = {
  id: string;
  name: string;
  institutionName: string;
};

type TransactionAccountDisplayMap = Map<string, TransactionAccountDisplay>;

function normalizeStatus(status: TransactionRecord["status"]): TransactionStatus {
  if (status === "completed") return "confirmed";
  if (status === "flagged") return "needs_review";
  return status;
}

function inferType(record: TransactionRecord): TransactionType {
  if (record.type) {
    return record.type;
  }

  return record.direction;
}

function getAccountName(
  accountId: string | null | undefined,
  accountMap?: TransactionAccountDisplayMap
) {
  if (!accountId) {
    return null;
  }

  const account = accountMap?.get(accountId);
  if (!account) {
    return null;
  }

  return account.name;
}

export function mapTransactionRecord(
  record: TransactionRecord,
  accountMap?: TransactionAccountDisplayMap
): Transaction {
  const type = inferType(record);
  const amount = Number(record.amount);
  const merchantName = record.merchant_name ?? record.merchant;
  const transactionDate = record.transaction_date ?? record.happened_at;

  return {
    id: record.id,
    source: record.source,
    sourceId: record.source_id ?? record.gmail_message_id,
    sourceMetadata: record.source_metadata ?? record.raw_payload ?? null,
    type,
    direction: record.direction,
    amount,
    signedAmount: getSignedTransactionAmount(type, amount),
    currencyCode: record.currency_code as "PHP" | "USD",
    accountId: record.account_id ?? null,
    accountName: getAccountName(record.account_id, accountMap),
    fromAccountId: record.from_account_id ?? null,
    fromAccountName: getAccountName(record.from_account_id, accountMap),
    toAccountId: record.to_account_id ?? null,
    toAccountName: getAccountName(record.to_account_id, accountMap),
    originalTransactionId: record.original_transaction_id ?? null,
    bankName: record.bank_name as Transaction["bankName"],
    bankInitials: getBankInitials(record.bank_name),
    merchantName,
    merchant: record.merchant,
    description: record.description,
    category: record.category as Transaction["category"],
    categoryLabel: formatTransactionLabel(record.category),
    referenceNumber: record.reference_number,
    notes: record.notes,
    status: normalizeStatus(record.status),
    kindLabel: formatTransactionLabel(type),
    transactionDate,
    happenedAt: record.happened_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    gmailMessageId: record.gmail_message_id,
    gmailThreadId: record.gmail_thread_id,
  };
}
