"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

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
import { GmailSyncSummaryPanel } from "@/features/transactions/components/GmailSyncSummaryPanel";
import { GmailConnectionCard } from "@/features/gmail/components/GmailConnectionCard";
import { useGmailConnection } from "@/features/gmail/hooks/useGmailConnection";
import {
  supportedBanks,
  transactionCategories,
  transactionDirections,
  transactionStatuses,
} from "@/features/transactions/constants/transaction.constants";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type {
  GmailSyncResult,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
} from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatCurrency } from "@/lib/format";
import { isGmailSyncEnabled } from "@/lib/app-config";

export function TransactionsView() {
  const searchParams = useSearchParams();
  const [gmailSyncResult, setGmailSyncResult] = useState<GmailSyncResult | null>(null);
  const gmailSyncEnabled = isGmailSyncEnabled();
  const { status: gmailStatus, error: gmailError, isPending: gmailPending, reloadConnection } =
    useGmailConnection(gmailSyncEnabled);
  const {
    transactions,
    summary,
    pagination,
    error,
    isPending,
    isSyncingGmail,
    search,
    setSearch,
    query,
    setQuery,
    createTransaction,
    syncGmailTransactions,
  } = useTransactions();
  const gmailMessage =
    searchParams.get("gmail_error") === "connection_failed"
      ? "Gmail could not be connected. Please try again."
      : searchParams.get("gmail_error") === "invalid_state"
        ? "The Gmail connection session expired. Please reconnect."
        : searchParams.get("gmail_error") === "missing_code"
          ? "Google did not return an authorization code."
          : searchParams.get("gmail_error") === "disabled"
            ? "Gmail sync is disabled for this deployment."
            : null;

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Transactions"
        title="Automated receipts plus quick manual ledger entries"
        description="Capture payment emails, extract reference numbers, and keep every transaction categorized and traceable."
        action={
          <QuickAddTransactionModal onSubmit={createTransaction} />
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

      {gmailSyncEnabled ? (
        <GmailConnectionCard
          status={gmailStatus}
          isPending={gmailPending}
          error={gmailMessage ?? gmailError}
          connectHref="/api/gmail/connect?next=/transactions"
          syncPending={isSyncingGmail}
          onSync={async () => {
            const result = await syncGmailTransactions();
            setGmailSyncResult(result);
            reloadConnection();
          }}
          onFullResync={async () => {
            const result = await syncGmailTransactions({
              daysBack: 365,
              maxPages: 20,
              reprocessExisting: true,
            });
            setGmailSyncResult(result);
            reloadConnection();
          }}
        />
      ) : (
        <div className="rounded-xl border border-secondary/20 bg-secondary/10 px-5 py-5">
          <p className="text-sm font-medium text-foreground">Manual mode is active for this deployment.</p>
          <p className="pt-1 text-sm text-muted">
            Gmail sync is turned off so this shared app does not connect to a personal mailbox.
          </p>
        </div>
      )}

      {gmailSyncResult ? <GmailSyncSummaryPanel result={gmailSyncResult} /> : null}

      <div className="rounded-xl border border-border bg-surface px-5 py-5">
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
                page: 1,
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
                page: 1,
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
                page: 1,
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
                page: 1,
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
        pagination={pagination}
        onPageChange={(page) =>
          setQuery((current) => ({
            ...current,
            page,
          }))
        }
      />
    </div>
  );
}
