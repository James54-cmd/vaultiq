import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createFinancialAccountSchema } from "@/features/accounts/schemas/account.schema";
import {
  createFinancialAccount,
  listFinancialAccounts,
  summarizeFinancialAccounts,
} from "@/features/accounts/services/account.service";
import { getUserPreferences } from "@/features/preferences/services/user-preferences.service";
import { createApiErrorResponse } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

export async function GET() {
  try {
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const [accounts, preferences] = await Promise.all([
      listFinancialAccounts(supabase),
      getUserPreferences(supabase, user.id),
    ]);
    const summary = summarizeFinancialAccounts(accounts, preferences.primaryCurrencyCode);

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ accounts: typeof accounts; summary: typeof summary }>>({
      data: {
        accounts,
        summary,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected accounts list error.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = createFinancialAccountSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const account = await createFinancialAccount(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof account>>(
      { data: account },
      { status: 201 }
    ));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected account creation error.");
  }
}
