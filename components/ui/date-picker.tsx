"use client";

import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDatePickerLabel, parseDateValue, toDateInputValue } from "@/lib/date";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "h-10 w-full justify-between rounded-sm border border-border bg-surface px-3 text-left font-normal text-foreground shadow-none hover:bg-accent-muted",
            !value && "text-muted",
            className
          )}
        >
          <span>{value ? formatDatePickerLabel(value) : placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden rounded-lg border-border bg-surface-raised p-0" align="start">
        <Calendar
          mode="single"
          selected={parseDateValue(value)}
          onSelect={(date) => onChange(toDateInputValue(date))}
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
  );
}
