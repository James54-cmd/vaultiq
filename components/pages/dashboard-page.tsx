"use client";

import {
  ArrowDownUp,
  CalendarClock,
  ChevronRight,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { BankAvatar } from "@/components/bank-avatar";
import { CountUp } from "@/components/count-up";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import { accounts, categorySpend, netWorthTrend, quickStats, transactions } from "@/lib/data";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const quickStatIcons = {
  TrendingUp,
  ArrowDownUp,
  PiggyBank,
  CalendarClock,
};

const totalAssets = accounts
  .filter((account) => account.balance > 0)
  .reduce((sum, account) => sum + account.balance, 0);
const totalLiabilities = Math.abs(
  accounts.filter((account) => account.balance < 0).reduce((sum, account) => sum + account.balance, 0)
);
const totalNetWorth = totalAssets - totalLiabilities;

export function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Command Center"
        title="Multi-bank financial visibility at a glance"
        description="Monitor balances, liabilities, cash flow, and category behavior across every connected bank and e-wallet."
        action={
          <div className="flex gap-3">
            <Button variant="secondary">Export Snapshot</Button>
            <Button>Connect Account</Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-secondary/20 bg-surface-raised">
        <CardContent className="grid gap-6 px-6 py-6 lg:grid-cols-2">
          <div className="space-y-5">
            <Badge variant="info" className="w-fit">
              Net Worth Summary
            </Badge>
            <div className="space-y-2">
              <p className="text-sm text-muted">Total Net Worth</p>
              <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                <div className="financial-figure text-4xl font-bold tracking-tightest text-foreground">
                  <CountUp value={totalNetWorth} prefix="₱" />
                </div>
                <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
                  <div>
                    <p>Total Assets</p>
                    <p className="financial-figure pt-1 font-semibold text-primary">
                      {formatCurrency(totalAssets)}
                    </p>
                  </div>
                  <div>
                    <p>Total Liabilities</p>
                    <p className="financial-figure pt-1 font-semibold text-error">
                      {formatCurrency(totalLiabilities)}
                    </p>
                  </div>
                  <div>
                    <p>Monthly Change</p>
                    <p className="financial-figure pt-1 font-semibold text-primary">+6.84%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">6-Month Trend</p>
                <p className="text-xs text-muted">Aggregated across all connected institutions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrend}>
                  <defs>
                    <linearGradient id="net-worth-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "#1E3251" }}
                    contentStyle={{
                      backgroundColor: "#122338",
                      border: "1px solid #1E3251",
                      borderRadius: 12,
                      color: "#F0F4F8",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fill="url(#net-worth-fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = quickStatIcons[stat.icon as keyof typeof quickStatIcons];
          const isPercent = stat.label.includes("Rate");
          const isCount = stat.label.includes("Bills");
          return (
            <Card key={stat.label} className="transition hover:border-secondary">
              <CardContent className="space-y-5 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-md border border-border bg-accent-muted p-3 text-secondary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={cn("text-sm font-medium", stat.delta >= 0 ? "text-primary" : "text-error")}>
                    {formatPercent(stat.delta)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="financial-figure pt-2 text-2xl font-bold tracking-tightest text-foreground">
                    {isCount
                      ? `${stat.value.toFixed(0)}`
                      : isPercent
                        ? `${stat.value.toFixed(2)}%`
                        : formatCurrency(stat.value)}
                  </p>
                  <p className="pt-1 text-xs text-muted">vs previous month</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>All Banks Overview</CardTitle>
              <p className="text-sm text-muted">Status, type, and live balance by institution</p>
            </div>
            <Button variant="secondary">Manage Banks</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.slice(0, 5).map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-4 rounded-md border border-border bg-background/50 p-4 transition hover:border-secondary sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <BankAvatar
                    name={account.bank}
                    initials={account.initials}
                    tone={account.accent === "primary" ? "primary" : "secondary"}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{account.bank}</p>
                      <Badge>{account.type}</Badge>
                    </div>
                    <p className="text-sm text-muted">{account.accountNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p
                      className={cn(
                        "financial-figure text-lg font-semibold",
                        account.balance >= 0 ? "text-primary" : "text-error"
                      )}
                    >
                      {formatCurrency(Math.abs(account.balance), account.currency)}
                    </p>
                    <p className="text-xs text-muted">{account.lastSynced}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <StatusDot status={account.status} />
                    <span className="capitalize">{account.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <p className="text-sm text-muted">Primary expense drivers this month</p>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpend}
                    dataKey="value"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {categorySpend.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#38BDF8", "#4ADE80", "#FBBF24", "#F87171", "#1A3045", "#8CA0B8"][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#122338",
                      border: "1px solid #1E3251",
                      borderRadius: 12,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {categorySpend.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: ["#38BDF8", "#4ADE80", "#FBBF24", "#F87171", "#1A3045", "#8CA0B8"][index],
                      }}
                    />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <span className="financial-figure text-sm text-muted">
                    {formatCompactCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-sm text-muted">Latest 10 transactions across all banks</p>
          </div>
          <Button variant="secondary">Open Transactions</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-background/70 text-2xs uppercase tracking-widest text-muted">
              <tr>
                {["Date", "Bank", "Description", "Category", "Amount", "Status"].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-border text-sm transition hover:bg-accent-muted"
                >
                  <td className="px-4 py-4 text-muted">{transaction.date}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <BankAvatar name={transaction.bank} initials={transaction.initials} />
                      <span>{transaction.bank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">{transaction.merchant}</p>
                      <p className="text-xs text-muted">{transaction.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted">{transaction.category}</td>
                  <td
                    className={cn(
                      "financial-figure px-4 py-4 font-semibold",
                      transaction.amount >= 0 ? "text-primary" : "text-error"
                    )}
                  >
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "success"
                          : transaction.status === "pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
