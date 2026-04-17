import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { gmailSyncSchema } from "@/features/transactions/schemas/transaction.schema";
import { syncGmailTransactions } from "@/features/transactions/services/transaction.service";
import { isGmailSyncEnabled } from "@/lib/app-config";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
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
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const result = await syncGmailTransactions(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<GmailSyncResult>>({
      data: result,
    }));
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

    if (
      error instanceof Error &&
      /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(error.message)
    ) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message:
              "Gmail sync database migration is missing. Apply the latest Supabase migration for the transactions conflict constraint, then try syncing again.",
          },
        },
        { status: 500 }
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
