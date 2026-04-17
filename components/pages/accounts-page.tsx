"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, ChevronRight, Plus, RefreshCcw, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { BankAvatar } from "@/components/bank-avatar";
import { CountUp } from "@/components/count-up";
import { SectionHeader } from "@/components/section-header";
import { StatusDot } from "@/components/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accounts, transactions } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const history = Array.from({ length: 30 }, (_, index) => ({
  day: `${index + 1}`,
  value: 720000 + Math.sin(index / 4) * 38000 + index * 2400,
}));

export function AccountsPage() {
  const [selectedId, setSelectedId] = useState(accounts[0].id);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedId) ?? accounts[0],
    [selectedId]
  );

  const accountTransactions = transactions.filter(
    (transaction) => transaction.bank === selectedAccount.bank
  );

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Accounts"
        title="Track every bank, card, and wallet in one grid"
        description="VaultIQ keeps balances, limits, sync health, and transaction context visible for every connected institution."
        action={<Button>Connect New Bank</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => setSelectedId(account.id)}
            className={cn(
              "rounded-lg border bg-surface p-0 text-left shadow-subtle transition hover:border-secondary",
              selectedId === account.id ? "border-secondary" : "border-border"
            )}
          >
            <Card className="h-full border-0 shadow-none">
              <CardContent className="space-y-5 px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BankAvatar
                      name={account.bank}
                      initials={account.initials}
                      tone={account.accent === "error" ? "error" : "secondary"}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{account.bank}</p>
                        <Badge>{account.type}</Badge>
                      </div>
                      <p className="text-xs text-muted">{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <StatusDot status={account.status} />
                    <span className="capitalize">{account.status}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-muted">Current Balance</p>
                  <p
                    className={cn(
                      "financial-figure text-2xl font-bold tracking-tightest",
                      account.balance >= 0 ? "text-primary" : "text-error"
                    )}
                  >
                    <CountUp
                      value={Math.abs(account.balance)}
                      prefix={account.currency === "USD" ? "$" : "₱"}
                    />
                  </p>
                  <p className={cn("text-sm", account.monthlyChange >= 0 ? "text-primary" : "text-error")}>
                    {formatPercent(account.monthlyChange)} this month
                  </p>
                </div>

                {account.type === "Credit" ? (
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted">Available Credit / Limit</p>
                    <p className="financial-figure pt-1 text-sm font-medium text-foreground">
                      {formatCurrency(account.availableCredit ?? 0)} /{" "}
                      {formatCurrency(account.creditLimit ?? 0)}
                    </p>
                  </div>
                ) : null}

                <p className="text-xs text-muted">Last synced {account.lastSynced}</p>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="px-4">
                    View Transactions
                  </Button>
                  <Button variant="ghost" className="px-4">
                    Transfer
                  </Button>
                  <Button variant="ghost" className="px-4">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}

        <Card className="border-dashed bg-surface-raised/70">
          <CardContent className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-accent-muted text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold tracking-tightest">Add Bank Account</p>
              <p className="text-sm text-muted">
                Connect local PH banks, e-wallets, USD accounts, and international cash hubs.
              </p>
            </div>
            <Button>Choose Institution</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-secondary/20 bg-surface-raised">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>{selectedAccount.bank} Account Detail</CardTitle>
            <p className="text-sm text-muted">Right-side drawer experience adapted into a responsive detail panel</p>
          </div>
          <Button variant="secondary">Open Full Drawer</Button>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs uppercase tracking-widest text-muted">Balance</p>
                <p className={cn("financial-figure pt-3 text-xl font-semibold", selectedAccount.balance >= 0 ? "text-primary" : "text-error")}>
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs uppercase tracking-widest text-muted">Account Type</p>
                <p className="pt-3 text-xl font-semibold text-foreground">{selectedAccount.type}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs uppercase tracking-widest text-muted">Sync Health</p>
                <div className="pt-3 flex items-center gap-2">
                  <StatusDot status={selectedAccount.status} />
                  <p className="text-xl font-semibold capitalize text-foreground">{selectedAccount.status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">30-Day Balance History</p>
                  <p className="text-sm text-muted">Trailing view for account-level trend analysis</p>
                </div>
                <RefreshCcw className="h-4 w-4 text-muted" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="account-history-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#122338",
                        border: "1px solid #1E3251",
                        borderRadius: 12,
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4ADE80"
                      strokeWidth={2}
                      fill="url(#account-history-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-background/40">
              <CardContent className="space-y-3 px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Account Snapshot</p>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>Institution</span>
                    <span className="text-foreground">{selectedAccount.bank}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Account Number</span>
                    <span className="text-foreground">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Last Sync</span>
                    <span className="text-foreground">{selectedAccount.lastSynced}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>30D Change</span>
                    <span className={selectedAccount.monthlyChange >= 0 ? "text-primary" : "text-error"}>
                      {formatPercent(selectedAccount.monthlyChange)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardHeader className="pb-4">
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {accountTransactions.slice(0, 4).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{transaction.merchant}</p>
                      <p className="text-xs text-muted">{transaction.category}</p>
                    </div>
                    <p className={cn("financial-figure text-sm font-semibold", transaction.amount >= 0 ? "text-primary" : "text-error")}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardContent className="space-y-3 px-5 py-5">
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <p className="font-semibold text-foreground">Monthly Spending from This Account</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Card + Wallet Outflow</span>
                    <span className="financial-figure text-foreground">₱38,420.75</span>
                  </div>
                  <div className="h-2 rounded-full bg-accent-muted">
                    <div className="h-2 w-3/4 rounded-full bg-secondary" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>75.00% of account budget cap</span>
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
