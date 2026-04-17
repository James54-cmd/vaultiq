import { NextResponse } from "next/server";

import { signOut } from "@/features/auth/services/auth.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { AuthSuccessResponse } from "@/features/auth/types/Auth";

export async function POST() {
  try {
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const result = await signOut(supabase);

    return applyCookies(
      NextResponse.json<ApiSuccessResponse<AuthSuccessResponse>>({
        data: result,
      })
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error instanceof Error ? error.message : "Unexpected sign-out error.",
        },
      },
      { status: 500 }
    );
  }
}
