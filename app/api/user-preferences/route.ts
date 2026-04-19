import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { updateUserPreferencesSchema } from "@/features/preferences/schemas/user-preferences.schema";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/features/preferences/services/user-preferences.service";
import { createApiErrorResponse } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const preferences = await getUserPreferences(supabase, user.id);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof preferences>>({
      data: preferences,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected user preferences error.");
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateUserPreferencesSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const preferences = await updateUserPreferences(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof preferences>>({
      data: preferences,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected user preferences update error.");
  }
}
