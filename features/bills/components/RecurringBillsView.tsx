"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";
import { BellRing, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillModal } from "@/features/bills/components/BillModal";
import { recurringBillStatusLabels } from "@/features/bills/constants/bill.constants";
import { useBills } from "@/features/bills/hooks/useBills";
import type { RecurringBill } from "@/features/bills/types/Bill";
import { buildRecurringBillOccurrences, getBillMonthRange } from "@/features/bills/utils/mapBillRecord";
import { formatCurrency } from "@/lib/format";

function buildMonthLabel(month: string) {
  return format(parseISO(`${month}-01T00:00:00`), "MMMM yyyy");
}

export function RecurringBillsView() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const { month, bills, occurrences, summary, error, isPending, setMonth, createBill, updateBill, deleteBill } = useBills(currentMonth);
  const [billToDelete, setBillToDelete] = useState<RecurringBill | null>(null);

  const monthRange = useMemo(() => getBillMonthRange(month), [month]);
  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthRange.start, { weekStartsOn: 0 }),
        end: endOfWeek(monthRange.end, { weekStartsOn: 0 }),
      }),
    [monthRange]
  );

  const upcomingOccurrences = useMemo(
    () => buildRecurringBillOccurrences(bills, new Date(), addDays(new Date(), 30)),
    [bills]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tightest text-foreground">Recurring Bill Reminders</h2>
          <p className="text-sm text-muted">
            A calendar-first view of subscriptions, utilities, and fixed obligations coming due.
          </p>
        </div>
        <BillModal onSubmit={createBill} />
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-5 py-5">
              <p className="text-sm text-muted">Scheduled This Month</p>
              <p className="financial-figure text-2xl font-semibold text-foreground">
                {summary.scheduledCount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-5 py-5">
              <p className="text-sm text-muted">Due Soon</p>
              <p className="financial-figure text-2xl font-semibold text-warning">
                {summary.dueSoonCount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface-raised">
            <CardContent className="space-y-2 px-5 py-5">
              <p className="text-sm text-muted">Scheduled Amount</p>
              <p className="financial-figure text-2xl font-semibold text-secondary">
                {formatCurrency(summary.totalScheduledAmount, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <ConfirmationModal
        open={billToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBillToDelete(null);
          }
        }}
        title="Delete Bill"
        description={billToDelete ? `This will remove ${billToDelete.name} from your reminder calendar.` : "This action cannot be undone."}
        confirmLabel="Delete Bill"
        onConfirm={async () => {
          if (billToDelete) {
            await deleteBill(billToDelete.id);
          }
        }}
      />

      {isPending && bills.length === 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[480px] w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          title="Add your first recurring bill"
          description="Track subscriptions and utility dates in one place before they disappear into autopay and memory."
          action="Add Bill"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border bg-surface-raised">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{buildMonthLabel(month)}</CardTitle>
                <p className="text-sm text-muted">Calendar of bill occurrences derived from each bill cadence and anchor date.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setMonth(format(subMonths(monthRange.start, 1), "yyyy-MM"))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setMonth(format(addMonths(monthRange.start, 1), "yyyy-MM"))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-2xs uppercase tracking-wide text-muted">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                  <div key={label} className="rounded-lg border border-border/50 bg-background/30 py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayOccurrences = occurrences.filter((occurrence) =>
                    isSameDay(parseISO(`${occurrence.dueDate}T00:00:00`), day)
                  );

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-28 rounded-xl border p-3 ${
                        isSameMonth(day, monthRange.start)
                          ? "border-border bg-background/25"
                          : "border-border/40 bg-background/10 text-muted/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${isSameMonth(day, monthRange.start) ? "text-foreground" : "text-muted/60"}`}>
                          {format(day, "d")}
                        </p>
                        {dayOccurrences.length > 0 ? (
                          <Badge variant={dayOccurrences.some((occurrence) => occurrence.isDueSoon) ? "warning" : "info"}>
                            {dayOccurrences.length}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="space-y-2 pt-3">
                        {dayOccurrences.slice(0, 2).map((occurrence) => (
                          <div
                            key={occurrence.id}
                            className={`rounded-lg border px-2.5 py-2 text-left ${
                              occurrence.isDueSoon
                                ? "border-warning/30 bg-warning/10"
                                : "border-secondary/20 bg-secondary/10"
                            }`}
                          >
                            <p className="truncate text-xs font-medium text-foreground">{occurrence.name}</p>
                            <p className="financial-figure pt-1 text-xs text-muted">
                              {formatCurrency(occurrence.amount, occurrence.currencyCode)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Upcoming 30 Days</CardTitle>
                <p className="text-sm text-muted">Bills that need attention soon, regardless of the calendar month in view.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingOccurrences.length === 0 ? (
                  <p className="text-sm text-muted">No bills are scheduled in the next 30 days.</p>
                ) : (
                  upcomingOccurrences.map((occurrence) => (
                    <div key={occurrence.id} className="rounded-xl border border-border bg-background/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{occurrence.name}</p>
                          <p className="text-sm text-muted">{occurrence.category}</p>
                        </div>
                        <Badge variant={occurrence.isDueSoon ? "warning" : "info"}>
                          {occurrence.isDueSoon ? "Due Soon" : occurrence.autopay ? "Autopay" : "Scheduled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-3 text-sm">
                        <span className="text-muted">{occurrence.dueDate}</span>
                        <span className="financial-figure text-foreground">
                          {formatCurrency(occurrence.amount, occurrence.currencyCode)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Recurring Bills</CardTitle>
                <p className="text-sm text-muted">Edit cadence, reminder lead time, and autopay status without leaving the calendar.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {bills.map((bill) => (
                  <div key={bill.id} className="rounded-xl border border-border bg-background/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{bill.name}</p>
                        <p className="text-sm text-muted">{bill.category}</p>
                      </div>
                      <Badge variant={bill.status === "active" ? "success" : bill.status === "paused" ? "warning" : "default"}>
                        {recurringBillStatusLabels[bill.status]}
                      </Badge>
                    </div>
                    <div className="pt-3 text-sm text-muted">
                      <p>{bill.cadence} cadence</p>
                      <p>Anchor date: {bill.anchorDate}</p>
                      <p>Reminder lead: {bill.reminderDaysBefore} day{bill.reminderDaysBefore === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <BellRing className="h-4 w-4 text-secondary" />
                        <span>{bill.autopay ? "Autopay enabled" : "Manual payment"}</span>
                      </div>
                      <span className="financial-figure text-sm text-foreground">
                        {formatCurrency(bill.amount, bill.currencyCode)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                      <BillModal
                        bill={bill}
                        onSubmit={async (input) => {
                          await updateBill(bill.id, input);
                        }}
                      />
                      <Button type="button" variant="secondary" className="text-error hover:text-error" onClick={() => setBillToDelete(bill)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
