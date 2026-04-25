import type { TransactionType } from "@/features/transactions/types/Transaction";

export function getSignedTransactionAmount(type: TransactionType, amount: number) {
  if (type === "income" || type === "refund" || type === "transfer") {
    return amount;
  }

  if (type === "adjustment") {
    return amount;
  }

  return Math.abs(amount) * -1;
}
