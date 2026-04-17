import { NextResponse } from "next/server";

import { getTransactionOverview } from "@/features/transactions/services/transaction.service";
import type { TransactionOverview } from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const overview = await getTransactionOverview();

    return NextResponse.json<ApiSuccessResponse<TransactionOverview>>({
      data: overview,
    });
  } catch (error) {
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
