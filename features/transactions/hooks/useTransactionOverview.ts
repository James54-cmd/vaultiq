"use client";

import { useEffect, useState, useTransition } from "react";

import { fetchTransactionOverview } from "@/features/transactions/services/transaction-api.service";
import type { TransactionOverview, TransactionOverviewPeriod } from "@/features/transactions/types/Transaction";

export function useTransactionOverview() {
  const [overview, setOverview] = useState<TransactionOverview | null>(null);
  const [period, setPeriod] = useState<TransactionOverviewPeriod>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadOverview = (nextPeriod = period) => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchTransactionOverview({ period: nextPeriod });
        setOverview(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard overview.");
      }
    });
  };

  useEffect(() => {
    reloadOverview(period);
  }, [period]);

  return {
    overview,
    period,
    setPeriod,
    error,
    isPending,
    reloadOverview,
  };
}
