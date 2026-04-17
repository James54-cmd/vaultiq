import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { gmailSyncSchema } from "@/features/transactions/schemas/transaction.schema";
import { syncGmailTransactions } from "@/features/transactions/services/transaction.service";
import { isGmailSyncEnabled } from "@/lib/app-config";
import type { GmailSyncResult } from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function POST(request: Request) {
  try {
    if (!isGmailSyncEnabled()) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Gmail sync is disabled for this deployment.",
          },
        },
        { status: 403 }
      );
    }

    const payload = gmailSyncSchema.parse(await request.json());
    const result = await syncGmailTransactions(payload);

    return NextResponse.json<ApiSuccessResponse<GmailSyncResult>>({
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Invalid Gmail sync payload.",
            details: error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error instanceof Error ? error.message : "Unexpected Gmail sync error.",
        },
      },
      { status: 500 }
    );
  }
}
