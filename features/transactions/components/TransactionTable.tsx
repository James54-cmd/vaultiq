"use client";

import { useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Pencil } from "lucide-react";

import { BankAvatar } from "@/components/bank-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionDetailsDialog } from "@/features/transactions/components/TransactionDetailsDialog";
import type { Transaction, TransactionListPagination } from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatDatePickerLabel } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type TransactionTableProps = {
  title: string;
  description: string;
  toolbar?: ReactNode;
  transactions: Transaction[];
  isPending?: boolean;
  pagination?: TransactionListPagination | null;
  onPageChange?: (page: number) => void;
  onEditTransaction?: (transaction: Transaction) => void;
};

const desktopTransactionTableColumns =
  "0.9fr 1.15fr 1.9fr 1fr 1fr 0.9fr";
const desktopTransactionTableColumnsWithActions =
  "0.9fr 1.15fr 1.9fr 1fr 1fr 0.9fr 0.8fr";

function statusVariant(status: Transaction["status"]) {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "error";
}

export function TransactionTable({
  title,
  description,
  toolbar,
  transactions,
  isPending = false,
  pagination,
  onPageChange,
  onEditTransaction,
}: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const desktopGridTemplate = onEditTransaction
    ? desktopTransactionTableColumnsWithActions
    : desktopTransactionTableColumns;
  const pageStart = pagination
    ? pagination.totalCount === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const pageEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalCount)
    : 0;

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, transaction: Transaction) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTransactionDetails(transaction);
    }
  };

  const stopRowSelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <Card className="border-border bg-surface">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted">{description}</p>
          </div>
          {toolbar ? <div>{toolbar}</div> : null}
        </CardHeader>
        <CardContent>
          <div
            data-tutorial="transaction-table"
            className="overflow-hidden rounded-lg border border-border md:rounded-xl"
          >
            <div className="overflow-x-auto rounded-t-lg md:rounded-t-xl">
              <div className="min-w-0 md:min-w-[760px]">
                <div
                  className="hidden rounded-t-lg border-b border-border bg-background px-3 py-3 text-xs font-medium uppercase tracking-widest text-muted md:grid md:items-center md:gap-3 md:rounded-t-xl md:px-4 lg:gap-4 lg:px-6 lg:py-4"
                  style={{ gridTemplateColumns: desktopGridTemplate }}
                >
                  <div className="whitespace-nowrap text-left">Date</div>
                  <div className="whitespace-nowrap text-left">Bank</div>
                  <div className="whitespace-nowrap text-left">Description</div>
                  <div className="whitespace-nowrap text-left">Category</div>
                  <div className="whitespace-nowrap text-left">Amount</div>
                  <div className="whitespace-nowrap text-left">Status</div>
                  {onEditTransaction ? <div className="whitespace-nowrap text-left"></div> : null}
                </div>

                <div className="divide-y divide-border">
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center px-4 py-3 md:grid md:items-center md:gap-3 md:px-4 md:py-4 lg:gap-4 lg:px-6"
                        style={{ gridTemplateColumns: desktopGridTemplate }}
                      >
                        <div className="flex w-full flex-col gap-3 py-1 md:hidden">
                          <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-3.5 w-24 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <Skeleton className="h-4 w-32 rounded-md" />
                              <Skeleton className="h-3 w-44 rounded-md" />
                            </div>
                          </div>
                          <div className="flex items-end justify-between gap-4">
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-16 rounded-md" />
                              <Skeleton className="h-4 w-20 rounded-md" />
                            </div>
                            <div className="space-y-1 text-right">
                              <Skeleton className="ml-auto h-3 w-16 rounded-md" />
                              <Skeleton className="ml-auto h-4 w-24 rounded-md" />
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:contents">
                          <Skeleton className="h-4 w-24 rounded-md" />
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40 rounded-md" />
                            <Skeleton className="h-3 w-52 rounded-md" />
                          </div>
                          <Skeleton className="h-4 w-20 rounded-md" />
                          <Skeleton className="h-4 w-20 rounded-md" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          {onEditTransaction ? <Skeleton className="h-8 w-16 rounded-md" /> : null}
                        </div>
                      </div>
                    ))
                  ) : transactions.length === 0 ? (
                    <div className="flex h-56 flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="rounded-full border border-secondary/20 bg-secondary/10 p-3 text-secondary">
                        <span className="text-lg font-semibold">₱</span>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">No transactions found</p>
                        <p className="text-sm text-muted">
                          New activity will appear here once transactions are logged or synced.
                        </p>
                      </div>
                    </div>
                  ) : (
                    transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        role="button"
                        tabIndex={0}
                        aria-haspopup="dialog"
                        aria-label={`View full details for ${transaction.merchant}`}
                        className="cursor-pointer items-center px-4 py-3 text-left transition hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 md:grid md:gap-3 md:px-4 md:py-4 lg:gap-4 lg:px-6"
                        style={{ gridTemplateColumns: desktopGridTemplate }}
                        onClick={() => openTransactionDetails(transaction)}
                        onKeyDown={(event) => handleRowKeyDown(event, transaction)}
                      >
                        <div className="flex flex-col gap-3 md:hidden">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-medium text-muted">
                              {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                            </div>
                            <Badge variant={statusVariant(transaction.status)}>
                              {formatTransactionLabel(transaction.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <BankAvatar name={transaction.bankName} initials={transaction.bankInitials} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {transaction.merchant}
                              </div>
                              <div className="truncate text-xs text-muted">
                                {transaction.bankName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-end justify-between gap-4">
                            <div className="min-w-0">
                              <div className="truncate text-xs text-muted">
                                {transaction.description}
                                {transaction.referenceNumber ? ` • Ref ${transaction.referenceNumber}` : ""}
                              </div>
                              <div className="pt-1 text-sm text-muted">
                                {transaction.categoryLabel}
                              </div>
                            </div>
                            <div
                              className={cn(
                                "financial-figure shrink-0 text-sm font-semibold",
                                transaction.signedAmount >= 0 ? "text-primary" : "text-error"
                              )}
                            >
                              {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
                            </div>
                          </div>
                          {onEditTransaction ? (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold"
                                onClick={(event) => {
                                  stopRowSelection(event);
                                  onEditTransaction(transaction);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <>
                          <div className="hidden whitespace-nowrap text-left text-sm text-muted md:block">
                            {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                          </div>

                          <div className="hidden min-w-0 items-center gap-3 md:flex">
                            <BankAvatar name={transaction.bankName} initials={transaction.bankInitials} />
                            <span className="truncate text-sm text-foreground">{transaction.bankName}</span>
                          </div>

                          <div className="hidden min-w-0 md:block">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {transaction.merchant}
                            </div>
                            <div className="truncate text-xs text-muted">
                              {transaction.description}
                              {transaction.referenceNumber ? ` • Ref ${transaction.referenceNumber}` : ""}
                            </div>
                          </div>

                          <div className="hidden truncate text-left text-sm text-muted md:block">
                            {transaction.categoryLabel}
                          </div>

                          <div
                            className={cn(
                              "hidden financial-figure text-left text-sm font-semibold md:block",
                              transaction.signedAmount >= 0 ? "text-primary" : "text-error"
                            )}
                          >
                            {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
                          </div>

                          <div className="hidden text-left md:block">
                            <Badge variant={statusVariant(transaction.status)}>
                              {formatTransactionLabel(transaction.status)}
                            </Badge>
                          </div>

                          {onEditTransaction ? (
                            <div className="hidden text-left md:block">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold"
                                onClick={(event) => {
                                  stopRowSelection(event);
                                  onEditTransaction(transaction);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          ) : null}
                        </>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {pagination && onPageChange ? (
              <div
                data-tutorial="pagination"
                className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs font-medium text-muted md:flex-row md:px-6 md:py-3 md:text-sm"
              >
                <span className="text-center md:text-left">
                  Showing {pageStart.toFixed(0)}-{pageEnd.toFixed(0)} of {pagination.totalCount.toFixed(0)} transaction
                  {pagination.totalCount === 1 ? "" : "s"}
                </span>
                <div className="flex w-full items-center justify-center gap-2 md:w-auto md:gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 flex-1 justify-center rounded-md border border-border bg-transparent px-3 font-semibold text-foreground hover:bg-accent-muted hover:text-foreground md:h-10 md:flex-initial md:px-4"
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage || isPending}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 flex-1 justify-center rounded-md border border-border bg-transparent px-3 font-semibold text-foreground hover:bg-accent-muted hover:text-foreground md:h-10 md:flex-initial md:px-4"
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage || isPending}
                  >
                    Next
                  </Button>
                </div>
                <span className="text-center md:text-right">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
        onEditTransaction={onEditTransaction}
      />
    </>
  );
}
