import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createSavingsGoalSchema } from "@/features/goals/schemas/goal.schema";
import {
  createSavingsGoal,
  listSavingsGoals,
  summarizeSavingsGoals,
} from "@/features/goals/services/goal.service";
import { getUserPreferences } from "@/features/preferences/services/user-preferences.service";
import { createApiErrorResponse } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const [goals, preferences] = await Promise.all([
      listSavingsGoals(supabase),
      getUserPreferences(supabase, user.id),
    ]);
    const summary = summarizeSavingsGoals(goals, preferences.primaryCurrencyCode);

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ goals: typeof goals; summary: typeof summary }>>({
      data: {
        goals,
        summary,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected goals list error.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = createSavingsGoalSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const goal = await createSavingsGoal(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof goal>>(
      { data: goal },
      { status: 201 }
    ));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected goal creation error.");
  }
}
