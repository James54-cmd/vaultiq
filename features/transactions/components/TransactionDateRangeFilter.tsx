"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TransactionQuery } from "@/features/transactions/types/Transaction";
import { formatDatePickerLabel, parseDateValue, toDateInputValue } from "@/lib/date";
import { cn } from "@/lib/utils";

type TransactionDateRangeFilterProps = {
  query: Pick<TransactionQuery, "dateFrom" | "dateTo">;
  onChange: (range: Pick<TransactionQuery, "dateFrom" | "dateTo">) => void;
  className?: string;
};

function getDateRangeLabel(query: Pick<TransactionQuery, "dateFrom" | "dateTo">) {
  if (query.dateFrom && query.dateTo) {
    return `${formatDatePickerLabel(query.dateFrom)} to ${formatDatePickerLabel(query.dateTo)}`;
  }

  if (query.dateFrom) {
    return `From ${formatDatePickerLabel(query.dateFrom)}`;
  }

  if (query.dateTo) {
    return `Until ${formatDatePickerLabel(query.dateTo)}`;
  }

  return "Any date";
}

export function TransactionDateRangeFilter({
  query,
  onChange,
  className,
}: TransactionDateRangeFilterProps) {
  const selectedRange: DateRange | undefined =
    query.dateFrom || query.dateTo
      ? {
        from: parseDateValue(query.dateFrom),
        to: parseDateValue(query.dateTo),
      }
      : undefined;
  const today = new Date();
  const hasDateRange = Boolean(query.dateFrom || query.dateTo);
  const updateRange = (range?: DateRange) => {
    onChange({
      dateFrom: toDateInputValue(range?.from),
      dateTo: toDateInputValue(range?.to),
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-between bg-background text-left font-normal",
              !hasDateRange && "text-muted"
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
              <span className="truncate">{getDateRangeLabel(query)}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden rounded-lg border-border bg-surface-raised p-0" align="start">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={updateRange}
            disabled={{ after: today }}
            numberOfMonths={1}
            className="bg-surface-raised text-foreground dark:bg-surface-raised"
            classNames={{
              month_caption: "flex h-8 w-full items-center justify-center px-8",
              caption_label: "text-sm font-semibold text-foreground",
              weekday: "flex-1 select-none rounded-md text-[0.8rem] font-normal text-muted",
              today:
                "rounded-md border border-secondary/30 bg-secondary/10 text-secondary data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-background",
              outside:
                "text-muted/60 aria-selected:text-muted/60 dark:text-muted/60 dark:aria-selected:text-muted/60",
              disabled: "text-muted/50 opacity-50",
              range_start: "rounded-l-md bg-accent-muted",
              range_middle: "rounded-none bg-accent-muted",
              range_end: "rounded-r-md bg-accent-muted",
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
