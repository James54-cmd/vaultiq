import {
  recurringBillOccurrenceSchema,
  recurringBillSchema,
} from "@/features/bills/schemas/bill.schema";
import type {
  RecurringBill,
  RecurringBillOccurrence,
  RecurringBillRecord,
} from "@/features/bills/types/Bill";
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

export function mapRecurringBillRecord(record: RecurringBillRecord) {
  return recurringBillSchema.parse({
    id: record.id,
    name: record.name,
    category: record.category,
    amount: Number(record.amount),
    currencyCode: record.currency_code,
    cadence: record.cadence,
    anchorDate: record.anchor_date,
    reminderDaysBefore: record.reminder_days_before,
    autopay: record.autopay,
    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}

function advanceRecurringBillDate(date: Date, cadence: RecurringBill["cadence"]) {
  if (cadence === "quarterly") {
    return addMonths(date, 3);
  }

  if (cadence === "yearly") {
    return addYears(date, 1);
  }

  return addMonths(date, 1);
}

export function buildRecurringBillOccurrences(
  bills: RecurringBill[],
  rangeStart: Date,
  rangeEnd: Date,
  today = new Date()
) {
  const safeRangeStart = startOfDay(rangeStart);
  const safeRangeEnd = startOfDay(rangeEnd);
  const safeToday = startOfDay(today);
  const occurrences: RecurringBillOccurrence[] = [];

  bills.forEach((bill) => {
    if (bill.status === "archived") {
      return;
    }

    let dueDate = startOfDay(parseISO(`${bill.anchorDate}T00:00:00`));
    let guard = 0;

    while (dueDate < safeRangeStart && guard < 240) {
      dueDate = advanceRecurringBillDate(dueDate, bill.cadence);
      guard += 1;
    }

    while (dueDate <= safeRangeEnd && guard < 360) {
      const reminderDate = addDays(dueDate, bill.reminderDaysBefore * -1);
      const daysUntilDue = differenceInCalendarDays(dueDate, safeToday);

      occurrences.push(
        recurringBillOccurrenceSchema.parse({
          id: `${bill.id}:${format(dueDate, "yyyy-MM-dd")}`,
          billId: bill.id,
          name: bill.name,
          category: bill.category,
          amount: bill.amount,
          currencyCode: bill.currencyCode,
          dueDate: format(dueDate, "yyyy-MM-dd"),
          reminderDate: format(reminderDate, "yyyy-MM-dd"),
          autopay: bill.autopay,
          status: bill.status,
          isDueSoon: daysUntilDue >= 0 && daysUntilDue <= bill.reminderDaysBefore,
        })
      );

      dueDate = advanceRecurringBillDate(dueDate, bill.cadence);
      guard += 1;
    }
  });

  return occurrences.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export function getBillMonthRange(month: string) {
  const monthStart = startOfMonth(parseISO(`${month}-01T00:00:00`));
  return {
    start: monthStart,
    end: endOfMonth(monthStart),
  };
}
