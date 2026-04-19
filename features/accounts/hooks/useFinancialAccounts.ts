"use client";

import { useEffect, useState, useTransition } from "react";

import {
  createFinancialAccountRequest,
  deleteFinancialAccountRequest,
  fetchFinancialAccounts,
  updateFinancialAccountRequest,
} from "@/features/accounts/services/account-api.service";
import type {
  CreateFinancialAccountInput,
  FinancialAccount,
  FinancialAccountSummary,
  UpdateFinancialAccountInput,
} from "@/features/accounts/types/FinancialAccount";

export function useFinancialAccounts() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [summary, setSummary] = useState<FinancialAccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadAccounts = () => {
    startTransition(async () => {
      try {
        setError(null);
        const payload = await fetchFinancialAccounts();
        setAccounts(payload.accounts);
        setSummary(payload.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load financial accounts.");
      }
    });
  };

  useEffect(() => {
    reloadAccounts();
  }, []);

  const createAccount = async (input: CreateFinancialAccountInput) => {
    await createFinancialAccountRequest(input);
    reloadAccounts();
  };

  const updateAccount = async (accountId: string, input: UpdateFinancialAccountInput) => {
    const updatedAccount = await updateFinancialAccountRequest(accountId, input);
    reloadAccounts();
    return updatedAccount;
  };

  const deleteAccount = async (accountId: string) => {
    await deleteFinancialAccountRequest(accountId);
    reloadAccounts();
  };

  return {
    accounts,
    summary,
    error,
    isPending,
    reloadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
