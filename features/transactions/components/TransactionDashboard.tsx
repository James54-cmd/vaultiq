"use client";

import { useState } from "react";
import { ArrowDownCircle, PiggyBank, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialAccounts } from "@/features/accounts/hooks/useFinancialAccounts";
import {
  GmailConnectionCard,
  GmailConnectionCardSkeleton,
} from "@/features/gmail/components/GmailConnectionCard";
import { useGmailConnection } from "@/features/gmail/hooks/useGmailConnection";
import { GmailSyncReviewFlow } from "@/features/transactions/components/GmailSyncReviewFlow";
import { QuickAddTransactionModal } from "@/features/transactions/components/QuickAddTransactionModal";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import { useTransactionOverview } from "@/features/transactions/hooks/useTransactionOverview";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import {
  transactionCategoryColors,
  transactionOverviewPeriods,
} from "@/features/transactions/constants/transaction.constants";
import type { GmailSyncResult, TransactionOverviewPeriod } from "@/features/transactions/types/Transaction";
import { formatCurrency } from "@/lib/format";
import { isGmailSyncEnabled } from "@/lib/app-config";

const summaryCardKeys = [
  {
    key: "totalBalance",
    label: "Cash Position",
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

function formatOverviewPeriodLabel(period: TransactionOverviewPeriod) {
  if (period === "allTime") {
    return "All Time";
  }

  return `${period.charAt(0).toUpperCase()}${period.slice(1)}`;
}

function getBudgetLeftLabel(period: TransactionOverviewPeriod, periodLabel: string) {
  if (period === "allTime") {
    return "Active Budget Left";
  }

  return `${periodLabel} Budget Left`;
}

function getBudgetLimitLabel(period: TransactionOverviewPeriod, periodLabel: string) {
  if (period === "daily") {
    return "Monthly Budget Limit";
  }

  if (period === "allTime") {
    return "Active Budget Limit";
  }

  return `${periodLabel} Budget Limit`;
}

export function TransactionDashboard() {
  const [gmailSyncResult, setGmailSyncResult] = useState<GmailSyncResult | null>(null);
  const gmailSyncEnabled = isGmailSyncEnabled();
  const { status: gmailStatus, error: gmailError, isPending: gmailPending, reloadConnection } =
    useGmailConnection(gmailSyncEnabled);
  const { overview, period, setPeriod, error, isPending, reloadOverview } = useTransactionOverview();
  const {
    createTransaction,
    syncGmailTransactions,
    commitGmailTransactionReview,
    isSyncingGmail,
    isCommittingGmailReview,
  } = useTransactions();
  const {
    accounts,
    summary: netWorthSummary,
    isPending: isAccountsPending,
    reloadAccounts,
  } = useFinancialAccounts();
  const periodLabel = formatOverviewPeriodLabel(period);
  const summaryCards = [
    summaryCardKeys[0],
    {
      ...summaryCardKeys[1],
      label: `${periodLabel} Spending`,
    },
    {
      ...summaryCardKeys[2],
      label: getBudgetLeftLabel(period, periodLabel),
    },
  ] as const;

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Dashboard"
        title="Phase one control panel for your transaction flow"
        description="Track logged balance movement, current-month spending, and budget headroom from one place."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Tabs value={period} onValueChange={(value) => setPeriod(value as TransactionOverviewPeriod)}>
              <TabsList className="h-11 rounded-lg border border-border bg-surface p-1">
                {transactionOverviewPeriods.map((option) => (
                  <TabsTrigger
                    key={option}
                    value={option}
                    className="rounded-md px-3 text-sm text-muted data-[state=active]:bg-accent-muted data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    {formatOverviewPeriodLabel(option)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <QuickAddTransactionModal
              accounts={accounts}
              onSubmit={async (input) => {
                await createTransaction(input);
                reloadOverview();
                reloadAccounts();
              }}
            />
          </div>
        }
      />

      {gmailSyncEnabled && gmailPending ? (
        <GmailConnectionCardSkeleton />
      ) : gmailSyncEnabled ? (
        <GmailConnectionCard
          status={gmailStatus}
          isPending={gmailPending}
          error={gmailError}
          connectHref="/api/gmail/connect?next=/"
          syncPending={isSyncingGmail}
          onSync={async () => {
            const result = await syncGmailTransactions();
            setGmailSyncResult(result);
            reloadConnection();
            reloadOverview();
          }}
          onFullResync={async () => {
            const result = await syncGmailTransactions({
              daysBack: 365,
              maxPages: 20,
              reprocessExisting: true,
            });
            setGmailSyncResult(result);
            reloadConnection();
            reloadOverview();
          }}
        />
      ) : null}

      <GmailSyncReviewFlow
        result={gmailSyncResult}
        isPending={isCommittingGmailReview}
        onResultChange={setGmailSyncResult}
        onCommitReview={(reviewBatchId, selectedReviewItemIds) =>
          commitGmailTransactionReview({
            reviewBatchId,
            selectedReviewItemIds,
          })
        }
        onAfterCommit={reloadOverview}
      />

      <Card className="overflow-hidden border-secondary/20 bg-surface-raised">
        <CardContent className="grid gap-4 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-widest text-secondary">Net Worth</p>
            {isAccountsPending || !netWorthSummary ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <p className={`financial-figure text-4xl font-bold tracking-tightest ${netWorthSummary.totalNetWorth >= 0 ? "text-primary" : "text-error"}`}>
                {formatCurrency(netWorthSummary.totalNetWorth, netWorthSummary.primaryCurrencyCode)}
              </p>
            )}
            <p className="text-sm text-muted">
              Aggregated from your account ledger in {netWorthSummary?.primaryCurrencyCode ?? "PHP"}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/30 p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Assets</p>
              {isAccountsPending || !netWorthSummary ? (
                <Skeleton className="mt-3 h-6 w-20" />
              ) : (
                <p className="financial-figure pt-3 text-lg font-semibold text-primary">
                  {formatCurrency(netWorthSummary.totalAssets, netWorthSummary.primaryCurrencyCode)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background/30 p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Liabilities</p>
              {isAccountsPending || !netWorthSummary ? (
                <Skeleton className="mt-3 h-6 w-20" />
              ) : (
                <p className="financial-figure pt-3 text-lg font-semibold text-error">
                  {formatCurrency(netWorthSummary.totalLiabilities, netWorthSummary.primaryCurrencyCode)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background/30 p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Included</p>
              {isAccountsPending || !netWorthSummary ? (
                <Skeleton className="mt-3 h-6 w-12" />
              ) : (
                <p className="financial-figure pt-3 text-lg font-semibold text-foreground">
                  {netWorthSummary.includedAccountCount.toFixed(0)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = card.key === "totalBalance"
            ? overview?.totalBalance ?? 0
            : card.key === "monthlySpending"
              ? overview?.periodSpending ?? 0
              : overview?.remainingBudget ?? 0;
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
              <CardTitle>{periodLabel} Cash Snapshot</CardTitle>
              <p className="text-sm text-muted">Income versus spending from the selected dashboard window.</p>
            </div>
            <Button variant="secondary" className="pointer-events-none">
              {periodLabel}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">Income</p>
              {isPending ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="financial-figure pt-2 text-2xl font-bold text-primary">
                  {formatCurrency(overview?.periodIncome ?? 0)}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">Expense</p>
              {isPending ? (
                <Skeleton className="mt-3 h-7 w-28" />
              ) : (
                <p className="financial-figure pt-2 text-2xl font-bold text-error">
                  {formatCurrency((overview?.periodExpense ?? 0) * -1)}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted">{getBudgetLimitLabel(period, periodLabel)}</p>
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
            <p className="text-sm text-muted">Auto-tagged breakdown from the selected {period} spending window.</p>
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
                        backgroundColor: "#FFFFFF",
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
        description={`Latest transactions from the selected ${period} dashboard window.`}
        transactions={overview?.recentTransactions ?? []}
        isPending={isPending}
      />
    </div>
  );
}
