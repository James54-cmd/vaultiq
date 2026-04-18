import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { updateTransactionEditableFieldsSchema } from "@/features/transactions/schemas/transaction.schema";
import { updateTransactionEditableFields } from "@/features/transactions/services/transaction.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

type TransactionRouteContext = {
  params: Promise<{
    transactionId: string;
  }>;
};

export async function PATCH(request: Request, context: TransactionRouteContext) {
  try {
    const { transactionId } = await context.params;
    const payload = updateTransactionEditableFieldsSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const transaction = await updateTransactionEditableFields(supabase, transactionId, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof transaction>>({
      data: transaction,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const firstFieldError = Object.values(flattened.fieldErrors).flat()[0];
    const firstFormError = flattened.formErrors[0];

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: firstFieldError ?? firstFormError ?? "Invalid transaction update payload.",
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

  if (error instanceof Error && error.message === "Transaction not found.") {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error.message,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected transaction update error.",
      },
    },
    { status: 500 }
  );
}
