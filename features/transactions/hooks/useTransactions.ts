"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import type { CSVRow } from "@/features/transactions/components/CSVImportFlow";

import { createManualTransactionFormSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  createManualTransactionRequest,
  fetchTransactions,
  syncGmailTransactionsRequest,
  updateTransactionEditableFieldsRequest,
} from "@/features/transactions/services/transaction-api.service";
import type {
  CreateManualTransactionInput,
  CreateManualTransactionFormInput,
  GmailSyncInput,
  GmailSyncResult,
  Transaction,
  TransactionListPagination,
  TransactionListSummary,
  TransactionQuery,
  UpdateTransactionEditableFieldsInput,
} from "@/features/transactions/types/Transaction";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionListSummary | null>(null);
  const [pagination, setPagination] = useState<TransactionListPagination | null>(null);
  const [query, setQuery] = useState<TransactionQuery>({
    page: 1,
    pageSize: 20,
  });
  const [searchDraft, setSearchDraft] = useState("");
  const deferredSearch = useDeferredValue(searchDraft);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeGmailSyncRef = useRef<Promise<GmailSyncResult> | null>(null);

  const loadTransactions = (nextQuery: TransactionQuery) => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchTransactions(nextQuery);
        setTransactions(payload.transactions);
        setSummary(payload.summary);
        setPagination(payload.pagination);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load transactions.");
      }
    });
  };

  useEffect(() => {
    const normalizedSearch = deferredSearch.trim();
    const nextQuery = {
      ...query,
      search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
    };

    loadTransactions(nextQuery);
  }, [query.bankName, query.category, query.direction, query.status, query.page, query.pageSize, deferredSearch]);

  const setSearch = (value: string) => {
    setSearchDraft(value);
    setQuery((current) => (
      current.page === 1
        ? current
        : {
          ...current,
          page: 1,
        }
    ));
  };

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

  const updateTransaction = async (
    transactionId: string,
    input: UpdateTransactionEditableFieldsInput
  ) => {
    const updatedTransaction = await updateTransactionEditableFieldsRequest(transactionId, input);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });

    return updatedTransaction;
  };

  const syncGmailTransactions = (input?: GmailSyncInput) => {
    if (activeGmailSyncRef.current) {
      return activeGmailSyncRef.current;
    }

    const syncPromise = (async () => {
      setIsSyncingGmail(true);

      try {
        const result = await syncGmailTransactionsRequest(input);
        loadTransactions({
          ...query,
          search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
        });
        return result;
      } finally {
        setIsSyncingGmail(false);
        activeGmailSyncRef.current = null;
      }
    })();

    activeGmailSyncRef.current = syncPromise;
    return syncPromise;
  };

  const importCSVTransactions = async (rows: CSVRow[]) => {
    // We execute them in batches or sequentially to avoid overwhelming the server,
    // but Promise.all is okay for small CSV files. We will process 5 at a time.
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.all(
        batch.map((row) => {
          const input: CreateManualTransactionInput = {
            source: "manual",
            currencyCode: "PHP",
            direction: row.Direction,
            amount: parseFloat(row.Amount.replace(/,/g, "")),
            bankName: (row.BankName || "UnionBank") as any,
            merchant: row.Description,
            description: row.Description,
            category: (row.Category?.toLowerCase() || "uncategorized") as any,
            referenceNumber: row.ReferenceNumber || undefined,
            happenedAt: row.Date,
            status: "completed",
            notes: "Imported via CSV",
          };
          const payload = createManualTransactionFormSchema.safeParse(input);
          const parsedPayload = payload.success ? payload.data : input;
          return createManualTransactionRequest(parsedPayload);
        })
      );
    }

    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });
  };

  return {
    transactions,
    summary,
    pagination,
    error,
    isPending,
    isSyncingGmail,
    search: searchDraft,
    setSearch,
    query,
    setQuery,
    createTransaction,
    updateTransaction,
    syncGmailTransactions,
    importCSVTransactions,
  };
}
