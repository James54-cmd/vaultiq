"use client";

import { ArrowDownCircle, PiggyBank, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GmailConnectionCard } from "@/features/gmail/components/GmailConnectionCard";
import { useGmailConnection } from "@/features/gmail/hooks/useGmailConnection";
import { QuickAddTransactionModal } from "@/features/transactions/components/QuickAddTransactionModal";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import { useTransactionOverview } from "@/features/transactions/hooks/useTransactionOverview";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { transactionCategoryColors } from "@/features/transactions/constants/transaction.constants";
import { formatCurrency } from "@/lib/format";
import { isGmailSyncEnabled } from "@/lib/app-config";

const summaryCards = [
  {
    key: "totalBalance",
    label: "Total Balance",
    icon: Wallet,
  },
  {
    key: "monthlySpending",
    label: "Monthly Spending",
    icon: ArrowDownCircle,
  },
  {
    key: "remainingBudget",
    label: "Remaining Budget",
    icon: PiggyBank,
  },
] as const;

export function TransactionDashboard() {
  const gmailSyncEnabled = isGmailSyncEnabled();
  const { status: gmailStatus, error: gmailError, isPending: gmailPending, reloadConnection } =
    useGmailConnection(gmailSyncEnabled);
  const { overview, error, isPending, reloadOverview } = useTransactionOverview();
  const { createTransaction, syncGmailTransactions, isPending: transactionPending } = useTransactions();

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Dashboard"
        title="Phase one control panel for your transaction flow"
        description="Track logged balance movement, current-month spending, and budget headroom from one place."
        action={
          <QuickAddTransactionModal
            onSubmit={async (input) => {
              await createTransaction(input);
              reloadOverview();
            }}
          />
        }
      />

      {gmailSyncEnabled ? (
        <GmailConnectionCard
          status={gmailStatus}
          isPending={gmailPending}
          error={gmailError}
          connectHref="/api/gmail/connect?next=/"
          syncPending={transactionPending}
          onSync={async () => {
            await syncGmailTransactions();
            reloadConnection();
            reloadOverview();
          }}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = overview?.[card.key] ?? 0;
          const colorClass =
            card.key === "monthlySpending"
              ? "text-error"
              : card.key === "remainingBudget"
                ? "text-primary"
                : value >= 0
                  ? "text-primary"
                  : "text-error";

          return (
            <Card key={card.key} className="border-border bg-surface">
              <CardContent className="space-y-4 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-md border border-secondary/20 bg-secondary/10 p-3 text-secondary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  {isPending ? (
                    <Skeleton className="mt-3 h-8 w-40" />
                  ) : (
                    <p className={`financial-figure pt-2 text-3xl font-bold ${colorClass}`}>
                      {formatCurrency(card.key === "monthlySpending" ? value * -1 : value)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-surface">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly Cash Snapshot</CardTitle>
              <p className="text-sm text-muted">Income versus spending from the current month ledger.</p>
            </div>
            <Button variant="secondary" className="pointer-events-none">
              Live
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">Income</p>
              {isPending ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="financial-figure pt-2 text-2xl font-bold text-primary">
                  {formatCurrency(overview?.monthlyIncome ?? 0)}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">Expense</p>
              {isPending ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="financial-figure pt-2 text-2xl font-bold text-error">
                  {formatCurrency((overview?.monthlyExpense ?? 0) * -1)}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">Budget Limit</p>
              {isPending ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="financial-figure pt-2 text-2xl font-bold text-foreground">
                  {formatCurrency(overview?.budgetLimit ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <p className="text-sm text-muted">Auto-tagged breakdown from logged spending.</p>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="h-56">
              {isPending ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview?.categorySpend ?? []}
                      dataKey="value"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {(overview?.categorySpend ?? []).map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={transactionCategoryColors[entry.name.toLowerCase()] ?? "#1A3045"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#122338",
                        border: "1px solid #1E3251",
                        borderRadius: 12,
                        color: "#F0F4F8",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-4">
              {isPending
                ? Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-5 w-full" />
                  ))
                : (overview?.categorySpend ?? []).map((category) => (
                    <div key={category.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              transactionCategoryColors[category.name.toLowerCase()] ?? "#1A3045",
                          }}
                        />
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <span className="financial-figure text-sm text-muted">
                        {formatCurrency(category.value)}
                      </span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <TransactionTable
        title="Recent Transactions"
        description="Latest transactions from manual logging and Gmail receipt parsing."
        transactions={overview?.recentTransactions ?? []}
        isPending={isPending}
      />
    </div>
  );
}
