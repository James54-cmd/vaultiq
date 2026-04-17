import type {
  Budget,
  BudgetApiListResponse,
  BudgetQuery,
  CreateBudgetInput,
} from "@/features/budgets/types/Budget";
import { ApiValidationError } from "@/lib/api-errors";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

function buildBudgetQueryString(query?: BudgetQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.period) searchParams.set("period", query.period);
  if (query.status) searchParams.set("status", query.status);
  if (query.category) searchParams.set("category", query.category);

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

function extractApiErrorMessage(error: ApiErrorResponse) {
  const details = error.error.details as
    | {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      }
    | undefined;

  const firstFieldError = details
    ? Object.values(details.fieldErrors ?? {}).flat()[0]
    : undefined;
  const firstFormError = details?.formErrors?.[0];

  return firstFieldError ?? firstFormError ?? error.error.message;
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

export async function fetchBudgets(query?: BudgetQuery): Promise<BudgetApiListResponse> {
  const response = await fetch(`/api/budgets${buildBudgetQueryString(query)}`, {
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

  const payload = (await response.json()) as ApiSuccessResponse<BudgetApiListResponse>;
  return payload.data;
}

export async function createBudgetRequest(input: CreateBudgetInput): Promise<Budget> {
  const response = await fetch("/api/budgets", {
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

  const payload = (await response.json()) as ApiSuccessResponse<Budget>;
  return payload.data;
}
