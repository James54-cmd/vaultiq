import { ApiValidationError } from "@/lib/api-errors";
import type {
  CreateRecurringBillInput,
  RecurringBill,
  RecurringBillApiListResponse,
  UpdateRecurringBillInput,
} from "@/features/bills/types/Bill";
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

export async function fetchRecurringBills(month?: string) {
  const searchParams = new URLSearchParams();
  if (month) {
    searchParams.set("month", month);
  }
  const queryString = searchParams.toString();

  const response = await fetch(`/api/bills${queryString.length > 0 ? `?${queryString}` : ""}`, {
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

  const payload = (await response.json()) as ApiSuccessResponse<RecurringBillApiListResponse>;
  return payload.data;
}

export async function createRecurringBillRequest(input: CreateRecurringBillInput) {
  const response = await fetch("/api/bills", {
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

  const payload = (await response.json()) as ApiSuccessResponse<RecurringBill>;
  return payload.data;
}

export async function updateRecurringBillRequest(billId: string, input: UpdateRecurringBillInput) {
  const response = await fetch(`/api/bills/${billId}`, {
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

  const payload = (await response.json()) as ApiSuccessResponse<RecurringBill>;
  return payload.data;
}

export async function deleteRecurringBillRequest(billId: string) {
  const response = await fetch(`/api/bills/${billId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }
}
