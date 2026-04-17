"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bankBreakdown, cashFlowWaterfall, categorySpend, monthlyComparison } from "@/lib/data";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export function AnalyticsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Analytics"
        title="See the shape of your cash flow, not just the totals"
        description="Income, expenses, savings, category concentration, and bank-level balance composition across the last 12 months."
        action={<Button variant="secondary">Custom Range</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
            <p className="text-sm text-muted">Monthly comparison across the last 12 months</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid stroke="#1E3251" vertical={false} />
                <XAxis dataKey="month" stroke="#8CA0B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#8CA0B8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#122338",
                    border: "1px solid #1E3251",
                    borderRadius: 12,
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="income" fill="#38BDF8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#F87171" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Savings Trend</CardTitle>
            <p className="text-sm text-muted">Savings line across the same monthly window</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparison}>
                <CartesianGrid stroke="#1E3251" vertical={false} />
                <XAxis dataKey="month" stroke="#8CA0B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#8CA0B8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#122338",
                    border: "1px solid #1E3251",
                    borderRadius: 12,
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="savings" stroke="#4ADE80" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <p className="text-sm text-muted">Ranked by current month spend</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorySpend.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border border-border p-4">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 2 ? "warning" : "default"}>{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">Share of expense concentration</p>
                  </div>
                </div>
                <p className="financial-figure text-sm text-foreground">{formatCompactCurrency(item.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank-by-Bank Breakdown</CardTitle>
            <p className="text-sm text-muted">Compare balances and liabilities across institutions</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankBreakdown.map((item) => {
              const width = `${Math.min((Math.abs(item.value) / 842500.42) * 100, 100)}%`;
              return (
                <div key={item.bank} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.bank}</span>
                    <span className={`financial-figure ${item.value >= 0 ? "text-primary" : "text-error"}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-accent-muted">
                    <div
                      className={`h-2 rounded-full ${item.value >= 0 ? "bg-secondary" : "bg-error"}`}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Waterfall</CardTitle>
          <p className="text-sm text-muted">Opening cash, inflows, outflows, and closing position</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {cashFlowWaterfall.map((item) => (
            <div key={item.name} className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs uppercase tracking-widest text-muted">{item.name}</p>
              <p className={`financial-figure pt-4 text-lg font-semibold ${item.value >= 0 ? "text-primary" : "text-error"}`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
