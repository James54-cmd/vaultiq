"use client";

import { BankAvatar } from "@/components/bank-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/features/transactions/types/Transaction";
import { formatDatePickerLabel } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type TransactionTableProps = {
  title: string;
  description: string;
  transactions: Transaction[];
  isPending?: boolean;
};

function statusVariant(status: Transaction["status"]) {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "error";
}

export function TransactionTable({
  title,
  description,
  transactions,
  isPending = false,
}: TransactionTableProps) {
  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[0.9fr_1.1fr_1.8fr_1fr_1fr_0.9fr] gap-4 border-b border-border bg-background px-6 py-4 text-2xs font-medium uppercase tracking-widest text-muted md:grid">
            <span>Date</span>
            <span>Bank</span>
            <span>Description</span>
            <span>Category</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-border">
            {isPending
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid gap-3 px-4 py-4 md:grid-cols-[0.9fr_1.1fr_1.8fr_1fr_1fr_0.9fr] md:px-6"
                  >
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))
              : null}

            {!isPending && transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <div className="rounded-full border border-secondary/20 bg-secondary/10 p-3 text-secondary">
                  <span className="text-lg font-semibold">₱</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">No transactions yet</p>
                  <p className="text-sm text-muted">Use Quick Add or Gmail sync to start building your ledger.</p>
                </div>
              </div>
            ) : null}

            {!isPending
              ? transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid gap-3 px-4 py-4 transition hover:bg-accent-muted md:grid-cols-[0.9fr_1.1fr_1.8fr_1fr_1fr_0.9fr] md:px-6"
                  >
                    <div className="text-sm text-muted">
                      {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                    </div>
                    <div className="flex items-center gap-3">
                      <BankAvatar name={transaction.bankName} initials={transaction.bankInitials} />
                      <span className="text-sm text-foreground">{transaction.bankName}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{transaction.merchant}</p>
                      <p className="text-xs text-muted">
                        {transaction.description}
                        {transaction.referenceNumber ? ` • Ref ${transaction.referenceNumber}` : ""}
                      </p>
                    </div>
                    <div className="text-sm text-muted">{transaction.categoryLabel}</div>
                    <div
                      className={cn(
                        "financial-figure text-sm font-semibold",
                        transaction.signedAmount >= 0 ? "text-primary" : "text-error"
                      )}
                    >
                      {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
                    </div>
                    <div>
                      <Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
