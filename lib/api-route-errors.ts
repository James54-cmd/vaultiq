import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiErrorResponse } from "@/types/api";

export function createApiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const firstFieldError = Object.values(flattened.fieldErrors).flat()[0];
    const firstFormError = flattened.formErrors[0];

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: firstFieldError ?? firstFormError ?? fallbackMessage,
          details: flattened,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === "Authentication required.") {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error.message,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : fallbackMessage,
      },
    },
    { status: 500 }
  );
}

export function createNotFoundApiError(message: string) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message,
      },
    },
    { status: 404 }
  );
}
