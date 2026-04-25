"use client";

import { QuickAddTransactionModal } from "@/features/transactions/components/QuickAddTransactionModal";
import type { FinancialAccount } from "@/features/accounts/types/FinancialAccount";
import type {
  Transaction,
  UpdateTransactionInput,
} from "@/features/transactions/types/Transaction";

type TransactionEditDialogProps = {
  transaction: Transaction | null;
  accounts?: FinancialAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transactionId: string, input: UpdateTransactionInput) => Promise<void>;
};

export function TransactionEditDialog({
  transaction,
  accounts = [],
  open,
  onOpenChange,
  onSubmit,
}: TransactionEditDialogProps) {
  if (!transaction) {
    return null;
  }

  return (
    <QuickAddTransactionModal
      mode="edit"
      transaction={transaction}
      accounts={accounts}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(input) => onSubmit(transaction.id, input as UpdateTransactionInput)}
    />
  );
}
