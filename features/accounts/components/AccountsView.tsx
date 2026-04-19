"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Landmark, Wallet } from "lucide-react";

import { BankAvatar } from "@/components/bank-avatar";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountModal } from "@/features/accounts/components/AccountModal";
import { AddAccountFlow } from "@/features/accounts/components/AddAccountFlow";
import {
  financialAccountKindLabels,
  financialAccountStatusLabels,
  financialAccountTypeLabels,
} from "@/features/accounts/constants/account.constants";
import { useFinancialAccounts } from "@/features/accounts/hooks/useFinancialAccounts";
import type { FinancialAccount } from "@/features/accounts/types/FinancialAccount";
import { getBankInitials } from "@/features/transactions/utils/getBankInitials";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function getAccountVariant(status: FinancialAccount["status"]): "default" | "success" | "warning" | "error" | "info" {
  if (status === "error") return "error";
  if (status === "syncing") return "warning";
  if (status === "active") return "success";
  return "default";
}

export function AccountsView() {
  const { accounts, summary, error, isPending, createAccount, updateAccount, deleteAccount } = useFinancialAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<FinancialAccount | null>(null);

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId]
  );

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Accounts"
        title="Build a clean asset and debt ledger"
        description="Manual and synced-style account records feed a single net-worth summary without forcing every account into the same mold."
        action={<AddAccountFlow onSubmit={createAccount} />}
      />

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Total Assets</p>
              <p className="financial-figure text-2xl font-semibold text-primary">
                {formatCurrency(summary.totalAssets, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Total Liabilities</p>
              <p className="financial-figure text-2xl font-semibold text-error">
                {formatCurrency(summary.totalLiabilities, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface-raised">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Net Worth</p>
              <p className={cn(
                "financial-figure text-2xl font-semibold",
                summary.totalNetWorth >= 0 ? "text-primary" : "text-error"
              )}>
                {formatCurrency(summary.totalNetWorth, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <ConfirmationModal
        open={accountToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAccountToDelete(null);
          }
        }}
        title="Delete Account"
        description={
          accountToDelete
            ? `This will remove ${accountToDelete.name} from your net worth ledger.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Account"
        onConfirm={async () => {
          if (accountToDelete) {
            await deleteAccount(accountToDelete.id);
          }
        }}
      />

      {isPending && accounts.length === 0 ? (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Add your first asset or liability"
          description="Track savings, cards, loans, or property so VaultIQ can turn scattered balances into a real net-worth picture."
          action="Create Account"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={cn(
                  "rounded-xl border text-left transition",
                  selectedAccount?.id === account.id
                    ? "border-secondary bg-surface-raised shadow-glow-info"
                    : "border-border bg-surface hover:border-secondary/40"
                )}
              >
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BankAvatar
                        name={account.institutionName}
                        initials={getBankInitials(account.institutionName)}
                        tone={account.kind === "asset" ? "secondary" : "warning"}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{account.name}</p>
                        <p className="text-sm text-muted">{account.institutionName}</p>
                      </div>
                    </div>
                    <Badge variant={getAccountVariant(account.status)}>
                      {financialAccountStatusLabels[account.status]}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-muted">
                      {financialAccountKindLabels[account.kind]}
                    </p>
                    <p className={cn(
                      "financial-figure text-2xl font-semibold",
                      account.kind === "asset" ? "text-primary" : "text-error"
                    )}>
                      {formatCurrency(account.currentBalance, account.currencyCode)}
                    </p>
                    <p className="text-sm text-muted">{financialAccountTypeLabels[account.accountType]}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge>{account.source === "manual" ? "Manual" : "Synced"}</Badge>
                    {!account.includeInNetWorth ? <Badge variant="warning">Excluded</Badge> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedAccount ? (
            <Card className="border-border bg-surface-raised">
              <CardHeader>
                <CardTitle>Account Detail</CardTitle>
                <p className="text-sm text-muted">
                  Native-currency record details and how this item affects the net-worth total.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    <BankAvatar
                      name={selectedAccount.institutionName}
                      initials={getBankInitials(selectedAccount.institutionName)}
                      tone={selectedAccount.kind === "asset" ? "secondary" : "warning"}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{selectedAccount.name}</p>
                      <p className="text-sm text-muted">{selectedAccount.institutionName}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "financial-figure pt-4 text-3xl font-bold",
                    selectedAccount.kind === "asset" ? "text-primary" : "text-error"
                  )}>
                    {formatCurrency(selectedAccount.currentBalance, selectedAccount.currencyCode)}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Kind</span>
                    <span className="text-foreground">{financialAccountKindLabels[selectedAccount.kind]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Type</span>
                    <span className="text-foreground">{financialAccountTypeLabels[selectedAccount.accountType]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status</span>
                    <span className="text-foreground">{financialAccountStatusLabels[selectedAccount.status]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Source</span>
                    <span className="text-foreground">{selectedAccount.source === "manual" ? "Manual" : "Synced"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Net Worth</span>
                    <span className="text-foreground">
                      {selectedAccount.includeInNetWorth ? "Included" : "Excluded"}
                    </span>
                  </div>
                  {selectedAccount.creditLimit !== null ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Credit Limit</span>
                      <span className="text-foreground">
                        {formatCurrency(selectedAccount.creditLimit, selectedAccount.currencyCode)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {selectedAccount.notes ? (
                  <div className="rounded-xl border border-border bg-background/30 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted">Notes</p>
                    <p className="pt-2 text-sm text-foreground">{selectedAccount.notes}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <AccountModal
                    account={selectedAccount}
                    onSubmit={async (input) => {
                      await updateAccount(selectedAccount.id, input);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-error hover:text-error"
                    onClick={() => setAccountToDelete(selectedAccount)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-surface-raised">
              <CardContent className="flex h-full items-center justify-center">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/40 text-secondary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground">Select an account</p>
                  <p className="max-w-sm text-sm text-muted">
                    Choose a record from the ledger to inspect its native balance, status, and net-worth impact.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border bg-surface">
          <CardContent className="space-y-3 px-5 py-5">
            <div className="flex items-center gap-3 text-secondary">
              <Building2 className="h-4 w-4" />
              <p className="text-sm font-medium text-foreground">Portfolio Breadth</p>
            </div>
            <p className="text-sm text-muted">
              {accounts.length} account record{accounts.length === 1 ? "" : "s"} tracked across manual and synced-style sources.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardContent className="space-y-3 px-5 py-5">
            <div className="flex items-center gap-3 text-secondary">
              <Landmark className="h-4 w-4" />
              <p className="text-sm font-medium text-foreground">Included In Net Worth</p>
            </div>
            <p className="text-sm text-muted">
              {summary?.includedAccountCount ?? 0} record{summary?.includedAccountCount === 1 ? "" : "s"} currently roll into the headline total.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardContent className="space-y-3 px-5 py-5">
            <div className="flex items-center gap-3 text-secondary">
              <Wallet className="h-4 w-4" />
              <p className="text-sm font-medium text-foreground">Primary Currency</p>
            </div>
            <p className="text-sm text-muted">
              Aggregated summaries convert into {summary?.primaryCurrencyCode ?? "PHP"} while each account keeps its native currency.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
