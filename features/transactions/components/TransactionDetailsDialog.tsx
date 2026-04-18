"use client";

import { BankAvatar } from "@/components/bank-avatar";
import { Badge } from "@/components/ui/badge";
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

function statusVariant(status: Transaction["status"]) {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "error";
}

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
      <DialogContent className={transactionDialogContentClassName}>
        <TransactionDialogHeaderFrame>
          <div className="flex items-start gap-3 pr-8">
            <BankAvatar name={transaction.bankName} initials={transaction.bankInitials} />
            <div className="min-w-0 flex-1 space-y-3">
              <TransactionDialogHeading
                eyebrow="Transaction Record"
                title={
                  <DialogTitle className="truncate text-base font-semibold text-foreground sm:text-lg">
                    {transaction.merchant}
                  </DialogTitle>
                }
                description={
                  <DialogDescription className="text-sm text-muted">
                    Full transaction context, traceability details, and audit timestamps for this row.
                  </DialogDescription>
                }
              />
              <div className="my-3 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(transaction.status)}>
                  {formatTransactionLabel(transaction.status)}
                </Badge>
                <Badge variant="info">{transaction.kindLabel}</Badge>
                <Badge>{formatTransactionLabel(transaction.source)}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-[20px] p-3 shadow-sm shadow-slate-950/5 sm:p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <div className="rounded-[18px] border border-border/70 bg-surface px-4 py-4 shadow-sm shadow-slate-950/5 sm:px-5 sm:py-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Transaction Amount
              </p>
              <p
                className={cn(
                  "financial-figure mt-2 text-2xl font-bold sm:text-3xl",
                  transaction.signedAmount >= 0 ? "text-primary" : "text-error"
                )}
              >
                {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
              <div className="rounded-[18px] border border-border/70 bg-surface px-4 py-4 shadow-sm shadow-slate-950/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Booked On</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                </p>
              </div>
              <div className="rounded-[18px] border border-border/70 bg-surface px-4 py-4 shadow-sm shadow-slate-950/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Source Bank</p>
                <p className="mt-2 text-sm text-muted">{transaction.bankName}</p>
              </div>
            </div>
          </div>
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
                <DetailField
                  label="Gmail Message ID"
                  value={formatOptionalValue(transaction.gmailMessageId, "Not linked to Gmail")}
                />
                <DetailField
                  label="Gmail Thread ID"
                  value={formatOptionalValue(transaction.gmailThreadId, "No Gmail thread")}
                />
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
