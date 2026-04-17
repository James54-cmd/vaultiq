"use client";

import { useEffect, useState, useTransition } from "react";

import { fetchTransactionOverview } from "@/features/transactions/services/transaction-api.service";
import type { TransactionOverview } from "@/features/transactions/types/Transaction";

export function useTransactionOverview() {
  const [overview, setOverview] = useState<TransactionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadOverview = () => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchTransactionOverview();
        setOverview(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard overview.");
      }
    });
  };

  useEffect(() => {
    reloadOverview();
  }, []);

  return {
    overview,
    error,
    isPending,
    reloadOverview,
  };
}
