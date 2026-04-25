"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import type { CSVRow } from "@/features/transactions/components/CSVImportFlow";

import { createTransactionFormSchema } from "@/features/transactions/schemas/transaction.schema";
import { supportedBanks, transactionCategories } from "@/features/transactions/constants/transaction.constants";
import {
  commitGmailTransactionReviewRequest,
  createTransactionRequest,
  deleteTransactionRequest,
  fetchTransactions,
  syncGmailTransactionsRequest,
  updateTransactionRequest,
} from "@/features/transactions/services/transaction-api.service";
import type {
  CreateTransactionInput,
  CreateTransactionFormInput,
  GmailSyncInput,
  GmailSyncResult,
  GmailSyncReviewCommitInput,
  Transaction,
  TransactionListPagination,
  TransactionListSummary,
  TransactionQuery,
  UpdateTransactionInput,
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
  const [isCommittingGmailReview, setIsCommittingGmailReview] = useState(false);
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
  }, [
    query.bankName,
    query.category,
    query.type,
    query.source,
    query.status,
    query.accountId,
    query.dateFrom,
    query.dateTo,
    query.page,
    query.pageSize,
    deferredSearch,
  ]);

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
    input: CreateTransactionInput | CreateTransactionFormInput
  ) => {
    const payload = createTransactionFormSchema.safeParse(input);
    const parsedPayload = payload.success ? payload.data : input as CreateTransactionInput;
    await createTransactionRequest(parsedPayload);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });
  };

  const updateTransaction = async (
    transactionId: string,
    input: UpdateTransactionInput
  ) => {
    const updatedTransaction = await updateTransactionRequest(transactionId, input);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });

    return updatedTransaction;
  };

  const deleteTransaction = async (transactionId: string) => {
    await deleteTransactionRequest(transactionId);
    loadTransactions({
      ...query,
      search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
    });
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

  const commitGmailTransactionReview = async (input: GmailSyncReviewCommitInput) => {
    setIsCommittingGmailReview(true);

    try {
      const result = await commitGmailTransactionReviewRequest(input);
      loadTransactions({
        ...query,
        search: deferredSearch.trim().length > 0 ? deferredSearch.trim() : undefined,
      });
      return result;
    } finally {
      setIsCommittingGmailReview(false);
    }
  };

  const importCSVTransactions = async (rows: CSVRow[]) => {
    // We execute them in batches or sequentially to avoid overwhelming the server,
    // but Promise.all is okay for small CSV files. We will process 5 at a time.
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.all(
        batch.map((row) => {
          const bankName = supportedBanks.find((bank) => bank === row.BankName) ?? "UnionBank";
          const category = transactionCategories.find((item) => item === row.Category?.toLowerCase()) ?? "uncategorized";
          const input: CreateTransactionInput = {
            source: "csv",
            type: row.Direction,
            direction: row.Direction === "transfer" ? "transfer" : row.Direction,
            currencyCode: "PHP",
            amount: parseFloat(row.Amount.replace(/,/g, "")),
            accountId: null,
            fromAccountId: null,
            toAccountId: null,
            originalTransactionId: null,
            merchantName: row.Description,
            merchant: row.Description,
            description: row.Description,
            category,
            referenceNumber: row.ReferenceNumber || null,
            transactionDate: row.Date,
            happenedAt: row.Date,
            status: "needs_review",
            notes: `Imported via CSV from ${bankName}`,
            sourceId: row.ReferenceNumber || null,
            sourceMetadata: {
              bankName,
            },
          };
          const payload = createTransactionFormSchema.safeParse(input);
          const parsedPayload = payload.success ? payload.data : input;
          return createTransactionRequest(parsedPayload);
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
    isCommittingGmailReview,
    search: searchDraft,
    setSearch,
    query,
    setQuery,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    syncGmailTransactions,
    commitGmailTransactionReview,
    importCSVTransactions,
  };
}
