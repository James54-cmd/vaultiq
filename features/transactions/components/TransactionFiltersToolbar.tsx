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
  transactionDirections,
  transactionStatuses,
} from "@/features/transactions/constants/transaction.constants";
import type {
  TransactionCategory,
  TransactionDirection,
  TransactionQuery,
  TransactionStatus,
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
  const directionFilterOptions: FilterOption[] = transactionDirections.map((direction) => ({
    value: direction,
    label: formatTransactionLabel(direction),
  }));
  const statusFilterOptions: FilterOption[] = transactionStatuses.map((status) => ({
    value: status,
    label: formatTransactionLabel(status),
  }));
  const activeFilterCount = [
    query.bankName,
    query.category,
    query.direction,
    query.status,
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
      direction: undefined,
      status: undefined,
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
  const updateDirectionFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      direction: value === "all" ? undefined : (value as TransactionDirection),
    }));
  const updateStatusFilter = (value: string) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      status: value === "all" ? undefined : (value as TransactionStatus),
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
      key: "direction",
      ariaLabel: "Filter transactions by direction",
      value: query.direction ?? "all",
      placeholder: "All Directions",
      options: directionFilterOptions,
      onValueChange: updateDirectionFilter,
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
