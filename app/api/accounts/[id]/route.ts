import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  deleteFinancialAccount,
  updateFinancialAccount,
} from "@/features/accounts/services/account.service";
import {
  financialAccountIdSchema,
  updateFinancialAccountSchema,
} from "@/features/accounts/schemas/account.schema";
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
    const accountId = financialAccountIdSchema.parse(id);
    const payload = updateFinancialAccountSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const account = await updateFinancialAccount(supabase, accountId, payload);

    if (!account) {
      return createNotFoundApiError("Account not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof account>>({
      data: account,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected account update error.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const accountId = financialAccountIdSchema.parse(id);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const deleted = await deleteFinancialAccount(supabase, accountId);

    if (!deleted) {
      return createNotFoundApiError("Account not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ deleted: true }>>({
      data: {
        deleted: true,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected account deletion error.");
  }
}
