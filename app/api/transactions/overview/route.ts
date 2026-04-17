import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { transactionOverviewQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import { getTransactionOverview } from "@/features/transactions/services/transaction.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { TransactionOverview } from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const query = transactionOverviewQuerySchema.parse({
      period: requestUrl.searchParams.get("period") ?? undefined,
    });
    const { supabase } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const overview = await getTransactionOverview(supabase, query);

    return NextResponse.json<ApiSuccessResponse<TransactionOverview>>({
      data: overview,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Invalid transaction overview request.",
            details: error.flatten(),
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
          message: error instanceof Error ? error.message : "Unexpected transaction overview error.",
        },
      },
      { status: 500 }
    );
  }
}
