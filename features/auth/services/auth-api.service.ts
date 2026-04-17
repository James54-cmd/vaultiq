import { ApiValidationError } from "@/lib/api-errors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { AuthSuccessResponse, SignInInput, SignUpInput } from "@/features/auth/types/Auth";

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

async function parseAuthResponse(response: Response) {
  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiValidationError(extractApiErrorMessage(error), extractApiValidationDetails(error));
  }

  const payload = (await response.json()) as ApiSuccessResponse<AuthSuccessResponse>;
  return payload.data;
}

export async function signInRequest(input: SignInInput) {
  const response = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseAuthResponse(response);
}

export async function signUpRequest(input: SignUpInput) {
  const response = await fetch("/api/auth/sign-up", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseAuthResponse(response);
}

export async function signOutRequest() {
  const response = await fetch("/api/auth/sign-out", {
    method: "POST",
  });

  return parseAuthResponse(response);
}

export async function signInWithGoogleRequest(redirectTo = "/") {
  const supabase = getSupabaseBrowserClient();
  const origin = window.location.origin;
  const nextPath = redirectTo.startsWith("/") ? redirectTo : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
      redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    window.location.assign(data.url);
  }
}
