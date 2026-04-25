"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Save, SquareMinus, XCircle } from "lucide-react";

import { BankAvatar } from "@/components/bank-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  GmailTransactionReviewItem,
  GmailSyncReviewCommitResult,
} from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatDatePickerLabel } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type GmailTransactionReviewDialogProps = {
  open: boolean;
  reviewBatchId: string | null;
  items: GmailTransactionReviewItem[];
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: (selectedReviewItemIds: string[]) => Promise<GmailSyncReviewCommitResult>;
};

const desktopReviewTableColumns =
  "0.9fr 1.15fr 1.1fr 1.9fr 1fr 0.9fr 0.95fr";

function statusVariant(status: GmailTransactionReviewItem["status"]) {
  if (status === "confirmed") return "success";
  if (status === "pending") return "warning";
  if (status === "needs_review") return "warning";
  if (status === "duplicate") return "default";
  return "error";
}

export function GmailTransactionReviewDialog({
  open,
  reviewBatchId,
  items,
  isPending = false,
  onOpenChange,
  onCommit,
}: GmailTransactionReviewDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const confirmedCount = selectedIds.size;
  const declinedCount = Math.max(0, items.length - confirmedCount);

  useEffect(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(itemIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleCommit = async () => {
    if (!reviewBatchId) {
      return;
    }

    await onCommit(Array.from(selectedIds));
    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          a11yTitle="Review Gmail transactions"
          className="max-w-[min(1180px,calc(100vw-1rem))] rounded-xl"
          requireExplicitClose={isPending}
        >
          <DialogHeader className="border-b border-border px-5 py-5 pr-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <DialogTitle>Review Gmail Transactions</DialogTitle>
                <DialogDescription className="pt-2">
                  Select the fetched transactions to add to the ledger. Unselected rows are declined when saved.
                </DialogDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 text-right sm:min-w-64">
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                  <p className="text-xs uppercase tracking-widest text-primary">Confirm</p>
                  <p className="financial-figure text-xl font-bold text-primary">{confirmedCount}</p>
                </div>
                <div className="rounded-lg border border-error/20 bg-error/10 px-3 py-2">
                  <p className="text-xs uppercase tracking-widest text-error">Decline</p>
                  <p className="financial-figure text-xl font-bold text-error">{declinedCount}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
              <p className="text-sm text-muted">
                {items.length.toFixed(0)} new transaction{items.length === 1 ? "" : "s"} awaiting review
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={selectAll} disabled={isPending}>
                  <CheckSquare className="h-4 w-4" />
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearSelection} disabled={isPending}>
                  <SquareMinus className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-3 py-3 md:px-5 md:py-5">
              <div className="overflow-hidden rounded-lg border border-border md:rounded-xl">
                <div className="overflow-x-auto rounded-t-lg md:rounded-t-xl">
                  <div className="min-w-0 md:min-w-[920px]">
                    <div
                      className="hidden rounded-t-lg border-b border-border bg-background px-3 py-3 text-xs font-medium uppercase tracking-widest text-muted md:grid md:items-center md:gap-3 md:rounded-t-xl md:px-4 lg:gap-4 lg:px-6 lg:py-4"
                      style={{ gridTemplateColumns: desktopReviewTableColumns }}
                    >
                      <div className="whitespace-nowrap text-left">Date</div>
                      <div className="whitespace-nowrap text-left">Bank</div>
                      <div className="whitespace-nowrap text-left">Amount</div>
                      <div className="whitespace-nowrap text-left">Description</div>
                      <div className="whitespace-nowrap text-left">Category</div>
                      <div className="whitespace-nowrap text-left">Status</div>
                      <div className="whitespace-nowrap text-left">Action</div>
                    </div>

                    <div className="divide-y divide-border">
                      {items.map((item) => {
                        const selected = selectedIds.has(item.id);

                        return (
                          <div
                            key={item.id}
                            className="items-center px-4 py-3 text-left md:grid md:gap-3 md:px-4 md:py-4 lg:gap-4 lg:px-6"
                            style={{ gridTemplateColumns: desktopReviewTableColumns }}
                          >
                            <div className="flex flex-col gap-3 md:hidden">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-medium text-muted">
                                  {formatDatePickerLabel(item.happenedAt.slice(0, 10))}
                                </div>
                                <Badge variant={statusVariant(item.status)}>
                                  {formatTransactionLabel(item.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <BankAvatar name={item.bankName} initials={item.bankInitials} />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold text-foreground">
                                    {item.merchant}
                                  </div>
                                  <div className="truncate text-xs text-muted">
                                    {item.bankName}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-end justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-xs text-muted">
                                    {item.description}
                                    {item.referenceNumber ? ` - Ref ${item.referenceNumber}` : ""}
                                  </div>
                                  <div className="pt-1 text-sm text-muted">
                                    {item.categoryLabel}
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "financial-figure shrink-0 text-sm font-semibold",
                                    item.signedAmount >= 0 ? "text-primary" : "text-error"
                                  )}
                                >
                                  {formatCurrency(item.signedAmount, item.currencyCode)}
                                </div>
                              </div>
                              <label className="flex items-center justify-end gap-2 text-xs font-medium">
                                <Checkbox
                                  aria-label={selected ? "Confirm transaction" : "Decline transaction"}
                                  checked={selected}
                                  disabled={isPending}
                                  onCheckedChange={() => toggleItem(item.id)}
                                />
                                <span className={selected ? "text-primary" : "text-error"}>
                                  {selected ? "Confirm" : "Decline"}
                                </span>
                              </label>
                            </div>

                            <>
                              <div className="hidden whitespace-nowrap text-left text-sm text-muted md:block">
                                {formatDatePickerLabel(item.happenedAt.slice(0, 10))}
                              </div>

                              <div className="hidden min-w-0 items-center gap-3 md:flex">
                                <BankAvatar name={item.bankName} initials={item.bankInitials} />
                                <span className="truncate text-sm text-foreground">{item.bankName}</span>
                              </div>

                              <div
                                className={cn(
                                  "hidden financial-figure text-left text-sm font-semibold md:block",
                                  item.signedAmount >= 0 ? "text-primary" : "text-error"
                                )}
                              >
                                {formatCurrency(item.signedAmount, item.currencyCode)}
                              </div>

                              <div className="hidden min-w-0 md:block">
                                <div className="truncate text-sm font-semibold text-foreground">
                                  {item.merchant}
                                </div>
                                <div className="truncate text-xs text-muted">
                                  {item.description}
                                  {item.referenceNumber ? ` - Ref ${item.referenceNumber}` : ""}
                                </div>
                              </div>

                              <div className="hidden truncate text-left text-sm text-muted md:block">
                                {item.categoryLabel}
                              </div>

                              <div className="hidden text-left md:block">
                                <Badge variant={statusVariant(item.status)}>
                                  {formatTransactionLabel(item.status)}
                                </Badge>
                              </div>

                              <label className="hidden items-center gap-2 text-left text-xs font-medium md:flex">
                                <Checkbox
                                  aria-label={selected ? "Confirm transaction" : "Decline transaction"}
                                  checked={selected}
                                  disabled={isPending}
                                  onCheckedChange={() => toggleItem(item.id)}
                                />
                                <span className={selected ? "text-primary" : "text-error"}>
                                  {selected ? "Confirm" : "Decline"}
                                </span>
                              </label>
                            </>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-background px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
              Close
            </Button>
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending || !reviewBatchId || items.length === 0}
            >
              <Save className="h-4 w-4" />
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="px-5 pt-5">
            <AlertDialogTitle>Save Gmail review?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmedCount.toFixed(0)} transaction{confirmedCount === 1 ? "" : "s"} will be added to the ledger.
              {" "}
              {declinedCount.toFixed(0)} transaction{declinedCount === 1 ? "" : "s"} will be declined and hidden from future sync review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-5 pb-5">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleCommit}>
              {isPending ? "Saving..." : "Save Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
