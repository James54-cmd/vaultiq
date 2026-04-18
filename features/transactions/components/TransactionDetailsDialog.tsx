"use client";

import { BankAvatar } from "@/components/bank-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <div className={cn("rounded-xl border border-border bg-background/70 px-4 py-3", className)}>
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
      <DialogContent className="flex min-h-[90vh] w-[calc(100vw-32px)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground sm:w-full">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-5 text-left sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 pr-8">
            <BankAvatar name={transaction.bankName} initials={transaction.bankInitials} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold text-foreground sm:text-lg">
                {transaction.merchant}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted">
                Full transaction context, traceability details, and audit timestamps for this row.
              </DialogDescription>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(transaction.status)}>
                  {formatTransactionLabel(transaction.status)}
                </Badge>
                <Badge variant="info">{transaction.kindLabel}</Badge>
                <Badge>{formatTransactionLabel(transaction.source)}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-background/80 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
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
              <div className="space-y-1 text-left sm:text-right">
                <p className="text-sm font-medium text-foreground">
                  {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                </p>
                <p className="text-sm text-muted">{transaction.bankName}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-5">
          <div className="space-y-6">
            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Transaction Snapshot</p>
                <p className="text-xs text-muted">
                  Core ledger details visible at a glance for quick review.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Merchant" value={transaction.merchant} />
                <DetailField label="Category" value={transaction.categoryLabel} />
                <DetailField label="Description" value={transaction.description} className="sm:col-span-2" />
                <DetailField label="Reference Number" value={formatOptionalValue(transaction.referenceNumber)} />
                <DetailField label="Notes" value={formatOptionalValue(transaction.notes, "No notes added")} />
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Source & Audit Trail</p>
                <p className="text-xs text-muted">
                  Read-only metadata that keeps the record explainable and traceable.
                </p>
              </div>
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
            </section>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEditTransaction ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEditTransaction(transaction);
              }}
            >
              Edit Labels
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
