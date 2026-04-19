import { ApiValidationError } from "@/lib/api-errors";
import type {
  CreateFinancialAccountInput,
  FinancialAccount,
  FinancialAccountApiListResponse,
  UpdateFinancialAccountInput,
} from "@/features/accounts/types/FinancialAccount";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

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

export async function fetchFinancialAccounts() {
  const response = await fetch("/api/accounts", {
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

  const payload = (await response.json()) as ApiSuccessResponse<FinancialAccountApiListResponse>;
  return payload.data;
}

export async function createFinancialAccountRequest(input: CreateFinancialAccountInput) {
  const response = await fetch("/api/accounts", {
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

  const payload = (await response.json()) as ApiSuccessResponse<FinancialAccount>;
  return payload.data;
}

export async function updateFinancialAccountRequest(accountId: string, input: UpdateFinancialAccountInput) {
  const response = await fetch(`/api/accounts/${accountId}`, {
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

  const payload = (await response.json()) as ApiSuccessResponse<FinancialAccount>;
  return payload.data;
}

export async function deleteFinancialAccountRequest(accountId: string) {
  const response = await fetch(`/api/accounts/${accountId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }
}
