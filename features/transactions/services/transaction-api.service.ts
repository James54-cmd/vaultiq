import { ApiValidationError } from "@/lib/api-errors";
import type {
  CreateManualTransactionInput,
  GmailSyncInput,
  GmailSyncResult,
  TransactionListResponse,
  TransactionOverview,
  TransactionOverviewQuery,
  TransactionQuery,
  UpdateTransactionEditableFieldsInput,
} from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

function buildQueryString(query?: TransactionQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.bankName) searchParams.set("bankName", query.bankName);
  if (query.category) searchParams.set("category", query.category);
  if (query.direction) searchParams.set("direction", query.direction);
  if (query.status) searchParams.set("status", query.status);
  if (query.search) searchParams.set("search", query.search);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

function buildOverviewQueryString(query?: TransactionOverviewQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.period) searchParams.set("period", query.period);

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

function extractApiValidationDetails(error: ApiErrorResponse) {
  const details = error.error.details as
    | {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      }
    | undefined;

  return {
    fieldErrors: details?.fieldErrors,
    formErrors: details?.formErrors,
  };
}

function extractApiErrorMessage(error: ApiErrorResponse) {
  const details = extractApiValidationDetails(error);
  const firstFieldError = details.fieldErrors
    ? Object.values(details.fieldErrors).flat()[0]
    : undefined;
  const firstFormError = details.formErrors?.[0];

  return firstFieldError ?? firstFormError ?? error.error.message;
}

export async function fetchTransactions(query?: TransactionQuery) {
  const response = await fetch(`/api/transactions${buildQueryString(query)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = (await response.json()) as ApiSuccessResponse<TransactionListResponse>;
  return payload.data;
}

export async function createManualTransactionRequest(input: CreateManualTransactionInput) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = await response.json() as ApiSuccessResponse<TransactionListResponse["transactions"][number]>;
  return payload.data;
}

export async function updateTransactionEditableFieldsRequest(
  transactionId: string,
  input: UpdateTransactionEditableFieldsInput
) {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = await response.json() as ApiSuccessResponse<TransactionListResponse["transactions"][number]>;
  return payload.data;
}

export async function fetchTransactionOverview(query?: TransactionOverviewQuery) {
  const response = await fetch(`/api/transactions/overview${buildOverviewQueryString(query)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = await response.json() as ApiSuccessResponse<TransactionOverview>;
  return payload.data;
}

export async function syncGmailTransactionsRequest(input?: GmailSyncInput) {
  const response = await fetch("/api/transactions/gmail-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = await response.json() as ApiSuccessResponse<GmailSyncResult>;
  return payload.data;
}
