import { ApiValidationError } from "@/lib/api-errors";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
  SavingsGoalApiListResponse,
  UpdateSavingsGoalInput,
} from "@/features/goals/types/Goal";
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

export async function fetchSavingsGoals() {
  const response = await fetch("/api/goals", {
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

  const payload = (await response.json()) as ApiSuccessResponse<SavingsGoalApiListResponse>;
  return payload.data;
}

export async function createSavingsGoalRequest(input: CreateSavingsGoalInput) {
  const response = await fetch("/api/goals", {
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

  const payload = (await response.json()) as ApiSuccessResponse<SavingsGoal>;
  return payload.data;
}

export async function updateSavingsGoalRequest(goalId: string, input: UpdateSavingsGoalInput) {
  const response = await fetch(`/api/goals/${goalId}`, {
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

  const payload = (await response.json()) as ApiSuccessResponse<SavingsGoal>;
  return payload.data;
}

export async function deleteSavingsGoalRequest(goalId: string) {
  const response = await fetch(`/api/goals/${goalId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }
}
