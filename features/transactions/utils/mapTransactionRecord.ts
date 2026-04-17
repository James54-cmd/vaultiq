import type { TransactionRecord } from "@/features/transactions/types/TransactionRecord";
import type { Transaction } from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { getBankInitials } from "@/features/transactions/utils/getBankInitials";
import { getSignedTransactionAmount } from "@/features/transactions/utils/getSignedTransactionAmount";

export function mapTransactionRecord(record: TransactionRecord): Transaction {
  return {
    id: record.id,
    source: record.source,
    direction: record.direction,
    amount: Number(record.amount),
    signedAmount: getSignedTransactionAmount(record.direction, Number(record.amount)),
    currencyCode: record.currency_code as "PHP" | "USD",
    bankName: record.bank_name as Transaction["bankName"],
    bankInitials: getBankInitials(record.bank_name),
    merchant: record.merchant,
    description: record.description,
    category: record.category as Transaction["category"],
    categoryLabel: formatTransactionLabel(record.category),
    referenceNumber: record.reference_number,
    notes: record.notes,
    status: record.status,
    kindLabel: formatTransactionLabel(record.direction),
    happenedAt: record.happened_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    gmailMessageId: record.gmail_message_id,
    gmailThreadId: record.gmail_thread_id,
  };
}
