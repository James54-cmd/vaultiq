"use client";

import type { Dispatch, SetStateAction } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  supportedBanks,
  transactionCategories,
  transactionSources,
  transactionStatuses,
  transactionTypes,
} from "@/features/transactions/constants/transaction.constants";
import { TransactionDateRangeFilter } from "@/features/transactions/components/TransactionDateRangeFilter";
import type {
  TransactionCategory,
  TransactionQuery,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type TransactionFilterSelectProps = {
  ariaLabel: string;
  value: string;
  placeholder: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
  triggerClassName?: string;
};

type TransactionFiltersToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  query: TransactionQuery;
  setQuery: Dispatch<SetStateAction<TransactionQuery>>;
  error?: string | null;
};

function TransactionFilterSelect({
  ariaLabel,
  value,
  placeholder,
  options,
  onValueChange,
  triggerClassName,
}: TransactionFilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={ariaLabel} className={cn("bg-background", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TransactionFiltersToolbar({
  search,
  setSearch,
  query,
  setQuery,
  error,
}: TransactionFiltersToolbarProps) {
  const bankFilterOptions: FilterOption[] = supportedBanks.map((bankName) => ({
    value: bankName,
    label: bankName,
  }));
  const categoryFilterOptions: FilterOption[] = transactionCategories.map((category) => ({
    value: category,
    label: formatTransactionLabel(category),
  }));
  const typeFilterOptions: FilterOption[] = transactionTypes.map((type) => ({
    value: type,
    label: formatTransactionLabel(type),
  }));
  const sourceFilterOptions: FilterOption[] = transactionSources.map((source) => ({
    value: source,
    label: formatTransactionLabel(source),
  }));
  const statusFilterOptions: FilterOption[] = transactionStatuses.map((status) => ({
    value: status,
    label: formatTransactionLabel(status),
  }));
  const activeFilterCount = [
    query.bankName,
    query.category,
    query.type,
    query.source,
    query.status,
    query.dateFrom,
    query.dateTo,
  ].filter(Boolean).length;
  const hasSearchValue = search.trim().length > 0;
  const hasActiveFilters = activeFilterCount > 0 || hasSearchValue;

  const resetFilters = () => {
    setSearch("");
    setQuery((current) => ({
      ...current,
      page: 1,
      bankName: undefined,
      category: undefined,
      type: undefined,
      direction: undefined,
      source: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    }));
  };

  const updateBankFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      bankName: value === "all" ? undefined : (value as typeof supportedBanks[number]),
    }));
  const updateCategoryFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      category: value === "all" ? undefined : (value as TransactionCategory),
    }));
  const updateTypeFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      type: value === "all" ? undefined : (value as TransactionType),
      direction: undefined,
    }));
  const updateSourceFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      source: value === "all" ? undefined : (value as TransactionSource),
    }));
  const updateStatusFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      status: value === "all" ? undefined : (value as TransactionStatus),
    }));
  const updateDateRangeFilter = (range: Pick<TransactionQuery, "dateFrom" | "dateTo">) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    }));

  const filterControls = [
    {
      key: "bank",
      ariaLabel: "Filter transactions by bank",
      value: query.bankName ?? "all",
      placeholder: "All Banks",
      options: bankFilterOptions,
      onValueChange: updateBankFilter,
    },
    {
      key: "category",
      ariaLabel: "Filter transactions by category",
      value: query.category ?? "all",
      placeholder: "All Categories",
      options: categoryFilterOptions,
      onValueChange: updateCategoryFilter,
    },
    {
      key: "type",
      ariaLabel: "Filter transactions by type",
      value: query.type ?? "all",
      placeholder: "All Types",
      options: typeFilterOptions,
      onValueChange: updateTypeFilter,
    },
    {
      key: "source",
      ariaLabel: "Filter transactions by source",
      value: query.source ?? "all",
      placeholder: "All Sources",
      options: sourceFilterOptions,
      onValueChange: updateSourceFilter,
    },
    {
      key: "status",
      ariaLabel: "Filter transactions by status",
      value: query.status ?? "all",
      placeholder: "All Statuses",
      options: statusFilterOptions,
      onValueChange: updateStatusFilter,
    },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <Input
            className="pl-10"
            placeholder="Search merchant, description, or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="flex-1 justify-between bg-background">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </span>
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(24rem,calc(100vw-3rem))] p-4">
              <div className="grid gap-3">
                {filterControls.map((filter) => (
                  <TransactionFilterSelect
                    key={filter.key}
                    ariaLabel={filter.ariaLabel}
                    value={filter.value}
                    placeholder={filter.placeholder}
                    options={filter.options}
                    onValueChange={filter.onValueChange}
                    triggerClassName="w-full"
                  />
                ))}
                <TransactionDateRangeFilter
                  query={query}
                  onChange={updateDateRangeFilter}
                  className="w-full"
                />
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters ? (
            <Button type="button" variant="ghost" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <div className="relative w-[320px] shrink-0 lg:w-[380px]">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <Input
            className="bg-background pl-10"
            placeholder="Search merchant, description, or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filterControls.map((filter) => (
          <TransactionFilterSelect
            key={filter.key}
            ariaLabel={filter.ariaLabel}
            value={filter.value}
            placeholder={filter.placeholder}
            options={filter.options}
            onValueChange={filter.onValueChange}
            triggerClassName="w-[190px] lg:w-[210px]"
          />
        ))}

        <TransactionDateRangeFilter
          query={query}
          onChange={updateDateRangeFilter}
          className="w-[260px] shrink-0 lg:w-[300px]"
        />

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" className="shrink-0" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
