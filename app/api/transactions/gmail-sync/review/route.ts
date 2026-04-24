import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { gmailSyncReviewCommitSchema } from "@/features/transactions/schemas/transaction.schema";
import { commitGmailTransactionReview } from "@/features/transactions/services/transaction.service";
import { isGmailSyncEnabled } from "@/lib/app-config";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { GmailSyncReviewCommitResult } from "@/features/transactions/types/Transaction";
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

    const payload = gmailSyncReviewCommitSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const result = await commitGmailTransactionReview(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<GmailSyncReviewCommitResult>>({
      data: result,
    }));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Invalid Gmail review payload.",
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
          message: error instanceof Error ? error.message : "Unexpected Gmail review error.",
        },
      },
      { status: 500 }
    );
  }
}
