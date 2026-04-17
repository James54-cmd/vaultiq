import type { TransactionDirection } from "@/features/transactions/types/Transaction";

export function getSignedTransactionAmount(direction: TransactionDirection, amount: number) {
  if (direction === "income") {
    return amount;
  }

  return amount * -1;
}
