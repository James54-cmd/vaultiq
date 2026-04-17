"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";

import { createManualTransactionFormSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  createManualTransactionRequest,
  fetchTransactions,
  syncGmailTransactionsRequest,
} from "@/features/transactions/services/transaction-api.service";
import type {
  CreateManualTransactionInput,
  CreateManualTransactionFormInput,
  GmailSyncInput,
  Transaction,
  TransactionListSummary,
  TransactionQuery,
} from "@/features/transactions/types/Transaction";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionListSummary | null>(null);
  const [query, setQuery] = useState<TransactionQuery>({});
  const [searchDraft, setSearchDraft] = useState("");
  const deferredSearch = useDeferredValue(searchDraft);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadTransactions = (nextQuery: TransactionQuery) => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchTransactions(nextQuery);
        setTransactions(payload.transactions);
        setSummary(payload.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load transactions.");
      }
    });
  };

  useEffect(() => {
    const nextQuery = deferredSearch.trim().length > 0
      ? { ...query, search: deferredSearch.trim() }
      : { ...query, search: undefined };

    loadTransactions(nextQuery);
  }, [query.bankName, query.category, query.direction, query.status, deferredSearch]);

  const createTransaction = async (
    input: CreateManualTransactionInput | CreateManualTransactionFormInput
  ) => {
    const payload = createManualTransactionFormSchema.safeParse(input);
    const parsedPayload = payload.success ? payload.data : input as CreateManualTransactionInput;
    await createManualTransactionRequest(parsedPayload);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });
  };

  const syncGmailTransactions = async (input?: GmailSyncInput) => {
    const result = await syncGmailTransactionsRequest(input);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });
    return result;
  };

  return {
    transactions,
    summary,
    error,
    isPending,
    search: searchDraft,
    setSearch: setSearchDraft,
    query,
    setQuery,
    createTransaction,
    syncGmailTransactions,
  };
}
