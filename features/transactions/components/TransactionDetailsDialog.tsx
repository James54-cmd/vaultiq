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
                  transaction.signedAmount >= 0 ? "text-primary" : "text-error"
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
              { label: "Source Bank", value: transaction.bankName },
              { label: "Status", value: formatTransactionLabel(transaction.status) },
              { label: "Direction", value: transaction.kindLabel },
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
                <DetailField label="Direction" value={transaction.kindLabel} />
                <DetailField label="Source" value={formatTransactionLabel(transaction.source)} />
                <DetailField label="Bank" value={transaction.bankName} />
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
                Edit Labels
              </Button>
            ) : null}
          </div>
        </TransactionDialogFooterBar>
      </DialogContent>
    </Dialog>
  );
}
