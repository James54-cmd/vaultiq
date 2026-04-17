import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createManualTransactionSchema, transactionQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import {
  createManualTransaction,
  listTransactions,
} from "@/features/transactions/services/transaction.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type {
  TransactionListResponse,
} from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = transactionQuerySchema.parse({
      bankName: searchParams.get("bankName") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const { supabase } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const result = await listTransactions(supabase, query);

    return NextResponse.json<ApiSuccessResponse<TransactionListResponse>>({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createManualTransactionSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const transaction = await createManualTransaction(supabase, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof transaction>>(
      { data: transaction },
      { status: 201 }
    ));
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
          message: firstFieldError ?? firstFormError ?? "Invalid transaction request payload.",
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
        message: error instanceof Error ? error.message : "Unexpected transaction service error.",
      },
    },
    { status: 500 }
  );
}
