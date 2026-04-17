"use client";

import { useMemo, useState } from "react";
import { Download, Search, Tag, Trash2 } from "lucide-react";

import { BankAvatar } from "@/components/bank-avatar";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bankOptions, transactions } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const filterKinds = ["All", "Income", "Expense", "Transfer", "Pending"] as const;

export function TransactionsPage() {
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const [selectedKind, setSelectedKind] = useState<(typeof filterKinds)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesBank = selectedBank === "All Banks" || transaction.bank === selectedBank;
      const matchesKind = selectedKind === "All" || transaction.kind === selectedKind;
      const matchesSearch =
        search.length === 0 ||
        `${transaction.merchant} ${transaction.description} ${transaction.category}`
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchesBank && matchesKind && matchesSearch;
    });
  }, [search, selectedBank, selectedKind]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Transactions"
        title="Deep transaction review with fast bulk actions"
        description="Filter by bank, category, date intent, and status while keeping account provenance visible on every row."
      />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
              <Input
                className="pl-10"
                placeholder="Search merchant, category, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedBank}
                onValueChange={setSelectedBank}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Banks">All Banks</SelectItem>
                  {bankOptions.slice(0, 8).map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="All Categories">
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  <SelectItem value="Housing">Housing</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="Last 30 Days">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Last 30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="This Quarter">This Quarter</SelectItem>
                  <SelectItem value="Custom Range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterKinds.map((kind) => (
              <Button
                key={kind}
                type="button"
                variant="ghost"
                onClick={() => setSelectedKind(kind)}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-wide",
                  selectedKind === kind
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-accent-muted text-muted hover:text-foreground"
                )}
              >
                {kind}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-secondary/20 bg-surface-raised p-3">
              <Badge variant="info">{selectedIds.length} selected</Badge>
              <Button variant="secondary" className="px-4">
                <Tag className="mr-2 h-4 w-4" />
                Categorize
              </Button>
              <Button variant="secondary" className="px-4">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="secondary" className="px-4">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-background/70 text-2xs uppercase tracking-widest text-muted">
                <tr>
                  {["", "Date", "Bank", "Merchant", "Category", "Amount", "Status"].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border text-sm transition hover:bg-accent-muted"
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={() => toggleSelection(transaction.id)}
                      />
                    </td>
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
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{transaction.category}</Badge>
                        <Badge variant="info">Auto-tagged</Badge>
                      </div>
                    </td>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
