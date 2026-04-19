"use client";

import { useEffect, useState, useTransition } from "react";

import {
  createRecurringBillRequest,
  deleteRecurringBillRequest,
  fetchRecurringBills,
  updateRecurringBillRequest,
} from "@/features/bills/services/bill-api.service";
import type {
  CreateRecurringBillInput,
  RecurringBill,
  RecurringBillOccurrence,
  RecurringBillSummary,
  UpdateRecurringBillInput,
} from "@/features/bills/types/Bill";

export function useBills(initialMonth: string) {
  const [month, setMonth] = useState(initialMonth);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [occurrences, setOccurrences] = useState<RecurringBillOccurrence[]>([]);
  const [summary, setSummary] = useState<RecurringBillSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadBills = (nextMonth = month) => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchRecurringBills(nextMonth);
        setBills(payload.bills);
        setOccurrences(payload.occurrences);
        setSummary(payload.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recurring bills.");
      }
    });
  };

  useEffect(() => {
    reloadBills(month);
  }, [month]);

  const createBill = async (input: CreateRecurringBillInput) => {
    await createRecurringBillRequest(input);
    reloadBills();
  };

  const updateBill = async (billId: string, input: UpdateRecurringBillInput) => {
    const updatedBill = await updateRecurringBillRequest(billId, input);
    reloadBills();
    return updatedBill;
  };

  const deleteBill = async (billId: string) => {
    await deleteRecurringBillRequest(billId);
    reloadBills();
  };

  return {
    month,
    bills,
    occurrences,
    summary,
    error,
    isPending,
    setMonth,
    reloadBills,
    createBill,
    updateBill,
    deleteBill,
  };
}
