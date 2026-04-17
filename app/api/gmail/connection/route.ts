import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { getGmailConnectionForUser } from "@/features/gmail/services/gmail-connection.service";
import { gmailConnectionStatusSchema } from "@/features/gmail/schemas/gmail-connection.schema";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { GmailConnectionStatus } from "@/features/gmail/types/GmailConnection";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const connection = await getGmailConnectionForUser(supabase, user.id);

    const payload: GmailConnectionStatus = gmailConnectionStatusSchema.parse({
      connected: Boolean(connection),
      connection: connection
        ? {
            id: connection.id,
            provider: connection.provider,
            email: connection.email,
            hasRefreshToken: Boolean(connection.refreshToken),
            lastSyncedAt: connection.lastSyncedAt,
            scopes: connection.scopes,
          }
        : null,
    });

    return applyCookies(
      NextResponse.json<ApiSuccessResponse<GmailConnectionStatus>>({
        data: payload,
      })
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error instanceof Error ? error.message : "Failed to load Gmail connection.",
        },
      },
      { status: 500 }
    );
  }
}
