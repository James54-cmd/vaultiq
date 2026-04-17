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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
              <Input
                className="pl-10"
                placeholder="Search merchant, category, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
              <Select
                value={selectedBank}
                onValueChange={setSelectedBank}
              >
                <SelectTrigger className="w-full sm:w-40">
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
                <SelectTrigger className="w-full sm:w-44">
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
                <SelectTrigger className="w-full sm:w-40">
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
                  "rounded-full border px-2 py-1 text-xs font-medium uppercase tracking-wide sm:px-3 sm:py-2",
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
            <div className="flex flex-col gap-3 rounded-lg border border-secondary/20 bg-surface-raised p-3 sm:flex-row sm:items-center sm:gap-2">
              <Badge variant="info" className="self-start text-sm font-medium">{selectedIds.length} selected</Badge>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                <Button variant="secondary" className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  <Tag className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Categorize</span>
                  <span className="ml-1 sm:hidden">Cat</span>
                </Button>
                <Button variant="secondary" className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="ml-1 sm:hidden">Exp</span>
                </Button>
                <Button variant="secondary" className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="ml-1 sm:hidden">Del</span>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="border-strong overflow-hidden rounded-lg border md:rounded-xl">
            {/* Horizontal scroll wrapper so table stays aligned on small screens */}
            <div className="overflow-x-auto rounded-t-lg md:rounded-t-xl">
              <div className="md:min-w-[800px]">
                <div className="bg-background/70 text-2xs uppercase tracking-widest text-muted hidden rounded-t-lg border-b px-3 py-3 font-medium md:grid md:grid-cols-[minmax(50px,0.5fr)_minmax(80px,0.8fr)_minmax(120px,1.2fr)_minmax(140px,1.4fr)_minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(80px,0.8fr)] md:items-center md:gap-3 md:rounded-t-xl md:px-4 lg:gap-4 lg:px-6 lg:py-4 lg:text-sm">
                  <div className="text-left whitespace-nowrap"></div>
                  <div className="text-left whitespace-nowrap">Date</div>
                  <div className="text-left whitespace-nowrap">Bank</div>
                  <div className="text-left whitespace-nowrap">Merchant</div>
                  <div className="text-left whitespace-nowrap">Category</div>
                  <div className="text-left whitespace-nowrap">Amount</div>
                  <div className="text-left whitespace-nowrap">Status</div>
                </div>

                <div className="scrollbar-hide h-[calc(100vh-28rem)] divide-y divide-gray-200 overflow-y-auto md:h-[calc(100vh-30rem)] lg:h-[calc(100vh-30rem)]">
                  {filtered.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="cursor-pointer items-center border-b border-gray-200 px-4 py-3 hover:bg-accent-muted md:grid md:grid-cols-[minmax(50px,0.5fr)_minmax(80px,0.8fr)_minmax(120px,1.2fr)_minmax(140px,1.4fr)_minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(80px,0.8fr)] md:gap-3 md:border-0 md:px-4 md:py-4 lg:gap-4 lg:px-6"
                    >
                      {/* Mobile Layout */}
                      <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-surface/50 p-3 md:hidden md:border-0 md:bg-transparent md:p-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedIds.includes(transaction.id)}
                              onCheckedChange={() => toggleSelection(transaction.id)}
                            />
                            <div className="text-xs font-medium text-muted">{transaction.date}</div>
                          </div>
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
                        </div>
                        <div className="flex items-center gap-3">
                          <BankAvatar name={transaction.bank} initials={transaction.initials} />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {transaction.merchant}
                            </div>
                            <div className="truncate text-xs text-muted">
                              {transaction.bank} • {transaction.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "financial-figure text-base font-bold",
                              transaction.amount >= 0 ? "text-primary" : "text-error"
                            )}>
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="text-xs">{transaction.category}</Badge>
                            <Badge variant="info" className="text-xs">Auto-tagged</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <>
                        <div className="hidden md:block">
                          <Checkbox
                            checked={selectedIds.includes(transaction.id)}
                            onCheckedChange={() => toggleSelection(transaction.id)}
                          />
                        </div>

                        <div className="hidden text-left text-sm text-muted md:block">
                          {transaction.date}
                        </div>

                        <div className="hidden min-w-0 items-center gap-3 md:flex">
                          <BankAvatar name={transaction.bank} initials={transaction.initials} />
                          <span className="truncate text-sm text-foreground">{transaction.bank}</span>
                        </div>

                        <div className="hidden text-left md:block">
                          <div className="text-sm font-medium text-foreground">{transaction.merchant}</div>
                          <div className="text-xs text-muted">{transaction.description}</div>
                        </div>

                        <div className="hidden text-left md:block">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{transaction.category}</Badge>
                            <Badge variant="info">Auto-tagged</Badge>
                          </div>
                        </div>

                        <div className={cn(
                          "hidden financial-figure text-left text-sm font-semibold md:block",
                          transaction.amount >= 0 ? "text-primary" : "text-error"
                        )}>
                          {formatCurrency(transaction.amount)}
                        </div>

                        <div className="hidden text-left md:block">
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
                        </div>
                      </>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
