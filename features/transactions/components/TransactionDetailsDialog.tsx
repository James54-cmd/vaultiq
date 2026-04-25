"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TransactionDialogBody,
  TransactionDialogFooterBar,
  TransactionDialogHeaderFrame,
  TransactionDialogHeading,
  TransactionDialogMetaList,
  TransactionDialogSection,
  transactionDialogContentClassName,
} from "@/features/transactions/components/TransactionDialogScaffold";
import type { Transaction } from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatDatePickerLabel } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type TransactionDetailsDialogProps = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
};

type DetailFieldProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

function formatOptionalValue(value?: string | null, fallback = "Not available") {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSourceMetadataSummary(metadata?: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "Not available";
  }

  const keys = Object.keys(metadata);
  const provider = typeof metadata.provider === "string" ? metadata.provider : null;
  const bankName = typeof metadata.bankName === "string" ? metadata.bankName : null;
  const summaryPrefix = provider ?? bankName;

  return summaryPrefix
    ? `${summaryPrefix} metadata captured (${keys.length} fields)`
    : `Metadata captured (${keys.length} fields)`;
}

function amountClassName(transaction: Transaction) {
  if (transaction.type === "transfer" || transaction.type === "adjustment") {
    return "text-foreground";
  }

  return transaction.signedAmount >= 0 ? "text-primary" : "text-error";
}

function DetailField({ label, value, className, valueClassName }: DetailFieldProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-surface-raised/70 px-4 py-3 shadow-sm shadow-slate-950/5",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={cn("mt-2 break-words text-sm font-medium text-foreground", valueClassName)}>{value}</p>
    </div>
  );
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionDetailsDialogProps) {
  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(transactionDialogContentClassName, "max-w-2xl")}>
        <TransactionDialogHeaderFrame className="pr-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <TransactionDialogHeading
                title={
                  <DialogTitle className="truncate pr-6 text-base font-semibold text-foreground sm:text-lg">
                    {transaction.merchant}
                  </DialogTitle>
                }
                description={
                  <DialogDescription className="text-sm leading-5 text-muted">
                    Read-only details, labels, and audit timestamps for this transaction.
                  </DialogDescription>
                }
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Amount
              </p>
              <p
                className={cn(
                  "financial-figure mt-1 text-2xl font-bold sm:text-[2rem]",
                  amountClassName(transaction)
                )}
              >
              {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
              </p>
            </div>
          </div>
          <TransactionDialogMetaList
            className="sm:grid-cols-4"
            items={[
              {
                label: "Booked On",
                value: formatDatePickerLabel(transaction.happenedAt.slice(0, 10)),
              },
              { label: "Account", value: transaction.accountName ?? transaction.bankName },
              { label: "Status", value: formatTransactionLabel(transaction.status) },
              { label: "Type", value: transaction.kindLabel },
            ]}
          />
        </TransactionDialogHeaderFrame>

        <TransactionDialogBody>
          <div className="space-y-4 sm:space-y-5">
            <TransactionDialogSection
              title="Transaction Snapshot"
              description="Core ledger details visible at a glance for quick review."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Merchant" value={transaction.merchant} />
                <DetailField label="Category" value={transaction.categoryLabel} />
                <DetailField label="Description" value={transaction.description} className="sm:col-span-2" />
                <DetailField label="Type" value={formatTransactionLabel(transaction.type)} />
                <DetailField label="Status" value={formatTransactionLabel(transaction.status)} />
                <DetailField label="Account" value={formatOptionalValue(transaction.accountName)} />
                <DetailField label="From Account" value={formatOptionalValue(transaction.fromAccountName)} />
                <DetailField label="To Account" value={formatOptionalValue(transaction.toAccountName)} />
                <DetailField label="Reference Number" value={formatOptionalValue(transaction.referenceNumber)} />
                <DetailField label="Notes" value={formatOptionalValue(transaction.notes, "No notes added")} />
              </div>
            </TransactionDialogSection>

            <TransactionDialogSection
              title="Source & Audit Trail"
              description="Read-only metadata that keeps the record explainable and traceable."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Record ID" value={transaction.id} />
                <DetailField label="Currency" value={transaction.currencyCode} />
                <DetailField label="Status" value={formatTransactionLabel(transaction.status)} />
                <DetailField label="Type" value={transaction.kindLabel} />
                <DetailField label="Source" value={formatTransactionLabel(transaction.source)} />
                <DetailField label="Source ID" value={formatOptionalValue(transaction.sourceId)} />
                <DetailField label="Source Metadata" value={formatSourceMetadataSummary(transaction.sourceMetadata)} />
                <DetailField
                  label="Original Transaction"
                  value={formatOptionalValue(transaction.originalTransactionId)}
                />
                <DetailField label="Account Source" value={transaction.bankName} />
                <DetailField label="Transaction Date" value={formatTimestamp(transaction.transactionDate)} />
                <DetailField label="Created At" value={formatTimestamp(transaction.createdAt)} />
                <DetailField label="Last Updated" value={formatTimestamp(transaction.updatedAt)} />
              </div>
            </TransactionDialogSection>
          </div>
        </TransactionDialogBody>

        <TransactionDialogFooterBar>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEditTransaction ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => {
                  onOpenChange(false);
                  onEditTransaction(transaction);
                }}
              >
                Edit
              </Button>
            ) : null}
            {onDeleteTransaction ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  onOpenChange(false);
                  onDeleteTransaction(transaction);
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </TransactionDialogFooterBar>
      </DialogContent>
    </Dialog>
  );
}
