"use client";

import { RefreshCcw, Search } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickAddTransactionModal } from "@/features/transactions/components/QuickAddTransactionModal";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import {
  supportedBanks,
  transactionCategories,
  transactionDirections,
  transactionStatuses,
} from "@/features/transactions/constants/transaction.constants";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { TransactionCategory, TransactionDirection, TransactionStatus } from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatCurrency } from "@/lib/format";
import { isGmailSyncEnabled } from "@/lib/app-config";

export function TransactionsView() {
  const gmailSyncEnabled = isGmailSyncEnabled();
  const {
    transactions,
    summary,
    error,
    isPending,
    search,
    setSearch,
    query,
    setQuery,
    createTransaction,
    syncGmailTransactions,
  } = useTransactions();

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Transactions"
        title="Automated receipts plus quick manual ledger entries"
        description="Capture payment emails, extract reference numbers, and keep every transaction categorized and traceable."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            {gmailSyncEnabled ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  await syncGmailTransactions();
                }}
                disabled={isPending}
              >
                <RefreshCcw className="h-4 w-4" />
                Sync Gmail
              </Button>
            ) : null}
            <QuickAddTransactionModal onSubmit={createTransaction} />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-5 py-5">
          <p className="text-sm text-muted">Logged Transactions</p>
          <p className="financial-figure pt-2 text-2xl font-bold text-foreground">
            {(summary?.totalCount ?? 0).toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-5">
          <p className="text-sm text-muted">Income Logged</p>
          <p className="financial-figure pt-2 text-2xl font-bold text-primary">
            {formatCurrency(summary?.incomeAmount ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-5">
          <p className="text-sm text-muted">Expense Logged</p>
          <p className="financial-figure pt-2 text-2xl font-bold text-error">
            {formatCurrency(summary?.expenseAmount ? summary.expenseAmount * -1 : 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface px-5 py-5">
        {!gmailSyncEnabled ? (
          <div className="mb-4 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Manual mode is active for this deployment.</p>
            <p className="pt-1 text-sm text-muted">
              Gmail sync is turned off so this shared app does not connect to a personal mailbox.
            </p>
          </div>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
            <Input
              className="pl-10"
              placeholder="Search merchant, description, or reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select
            value={query.bankName ?? "all"}
            onValueChange={(value) =>
              setQuery((current) => ({
                ...current,
                bankName: value === "all" ? undefined : (value as typeof supportedBanks[number]),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Banks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {supportedBanks.map((bankName) => (
                <SelectItem key={bankName} value={bankName}>
                  {bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={query.category ?? "all"}
            onValueChange={(value) =>
              setQuery((current) => ({
                ...current,
                category: value === "all" ? undefined : (value as TransactionCategory),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {transactionCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatTransactionLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={query.direction ?? "all"}
            onValueChange={(value) =>
              setQuery((current) => ({
                ...current,
                direction: value === "all" ? undefined : (value as TransactionDirection),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              {transactionDirections.map((direction) => (
                <SelectItem key={direction} value={direction}>
                  {formatTransactionLabel(direction)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={query.status ?? "all"}
            onValueChange={(value) =>
              setQuery((current) => ({
                ...current,
                status: value === "all" ? undefined : (value as TransactionStatus),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {transactionStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatTransactionLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="pt-3 text-sm text-error">{error}</p> : null}
      </div>

      <TransactionTable
        title="Transaction Ledger"
        description="Every row keeps the source bank visible, with parsed references where available."
        transactions={transactions}
        isPending={isPending}
      />
    </div>
  );
}
