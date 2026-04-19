import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  deleteSavingsGoal,
  updateSavingsGoal,
} from "@/features/goals/services/goal.service";
import { savingsGoalIdSchema, updateSavingsGoalSchema } from "@/features/goals/schemas/goal.schema";
import { createApiErrorResponse, createNotFoundApiError } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const goalId = savingsGoalIdSchema.parse(id);
    const payload = updateSavingsGoalSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const goal = await updateSavingsGoal(supabase, goalId, payload);

    if (!goal) {
      return createNotFoundApiError("Goal not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof goal>>({
      data: goal,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected goal update error.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const goalId = savingsGoalIdSchema.parse(id);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const deleted = await deleteSavingsGoal(supabase, goalId);

    if (!deleted) {
      return createNotFoundApiError("Goal not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ deleted: true }>>({
      data: {
        deleted: true,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected goal deletion error.");
  }
}
