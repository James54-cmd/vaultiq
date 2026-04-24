import type { GmailTransactionReviewItem } from "@/features/transactions/types/Transaction";
import type { GmailTransactionReviewRecord } from "@/features/transactions/types/TransactionRecord";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { getBankInitials } from "@/features/transactions/utils/getBankInitials";
import { getSignedTransactionAmount } from "@/features/transactions/utils/getSignedTransactionAmount";

export function mapGmailTransactionReviewRecord(
  record: GmailTransactionReviewRecord
): GmailTransactionReviewItem {
  return {
    id: record.id,
    reviewBatchId: record.review_batch_id,
    gmailMessageId: record.gmail_message_id,
    gmailThreadId: record.gmail_thread_id,
    direction: record.direction,
    amount: Number(record.amount),
    signedAmount: getSignedTransactionAmount(record.direction, Number(record.amount)),
    currencyCode: record.currency_code,
    bankName: record.bank_name as GmailTransactionReviewItem["bankName"],
    bankInitials: getBankInitials(record.bank_name),
    merchant: record.merchant,
    description: record.description,
    category: record.category as GmailTransactionReviewItem["category"],
    categoryLabel: formatTransactionLabel(record.category),
    referenceNumber: record.reference_number,
    status: record.status,
    reviewStatus: record.review_status,
    happenedAt: record.happened_at,
    rawPayload: record.raw_payload,
    transactionId: record.transaction_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
