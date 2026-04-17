import { transactionCategoryKeywords } from "@/features/transactions/constants/transaction.constants";
import type { TransactionCategory } from "@/features/transactions/types/Transaction";

export function categorizeTransaction(input: {
  merchant?: string | null;
  description?: string | null;
  direction?: "income" | "expense" | "transfer";
}) {
  if (input.direction === "transfer") {
    return "transfers" satisfies TransactionCategory;
  }

  const haystack = `${input.merchant ?? ""} ${input.description ?? ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(transactionCategoryKeywords)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category as TransactionCategory;
    }
  }

  if (input.direction === "income") {
    return "salary" satisfies TransactionCategory;
  }

  return "uncategorized" satisfies TransactionCategory;
}
