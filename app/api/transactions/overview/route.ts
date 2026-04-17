import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { getTransactionOverview } from "@/features/transactions/services/transaction.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { TransactionOverview } from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const { supabase } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const overview = await getTransactionOverview(supabase);

    return NextResponse.json<ApiSuccessResponse<TransactionOverview>>({
      data: overview,
    });
  } catch (error) {
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
