"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { SectionHeader } from "@/components/section-header";
import { QuickAddTransactionModal } from "@/features/transactions/components/QuickAddTransactionModal";
import { TransactionEditDialog } from "@/features/transactions/components/TransactionEditDialog";
import { TransactionFiltersToolbar } from "@/features/transactions/components/TransactionFiltersToolbar";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import { CSVImportFlow } from "@/features/transactions/components/CSVImportFlow";
import { GmailSyncSummaryPanel } from "@/features/transactions/components/GmailSyncSummaryPanel";
import { GmailConnectionCard } from "@/features/gmail/components/GmailConnectionCard";
import { useGmailConnection } from "@/features/gmail/hooks/useGmailConnection";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { GmailSyncResult, Transaction } from "@/features/transactions/types/Transaction";
import { formatCurrency } from "@/lib/format";
import { isGmailSyncEnabled } from "@/lib/app-config";

export function TransactionsView() {
  const searchParams = useSearchParams();
  const [gmailSyncResult, setGmailSyncResult] = useState<GmailSyncResult | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
    updateTransaction,
    syncGmailTransactions,
    importCSVTransactions,
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
          <div className="flex items-center gap-2">
            <CSVImportFlow onImport={importCSVTransactions} />
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

      <TransactionTable
        title="Transaction Ledger"
        description="Every row keeps the source bank visible, with parsed references where available. Only merchant, category, and notes can be edited."
        toolbar={
          <TransactionFiltersToolbar
            search={search}
            setSearch={setSearch}
            query={query}
            setQuery={setQuery}
            error={error}
          />
        }
        transactions={transactions}
        isPending={isPending}
        pagination={pagination}
        onPageChange={(page) =>
          setQuery((current) => ({
            ...current,
            page,
          }))
        }
        onEditTransaction={setSelectedTransaction}
      />

      <TransactionEditDialog
        transaction={selectedTransaction}
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
        onSubmit={async (transactionId, input) => {
          const updatedTransaction = await updateTransaction(transactionId, input);
          setSelectedTransaction(updatedTransaction);
        }}
      />
    </div>
  );
}
