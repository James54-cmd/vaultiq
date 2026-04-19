import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createRecurringBillSchema } from "@/features/bills/schemas/bill.schema";
import {
  createRecurringBill,
  listRecurringBills,
  parseRecurringBillMonth,
  summarizeRecurringBills,
} from "@/features/bills/services/bill.service";
import { buildRecurringBillOccurrences, getBillMonthRange } from "@/features/bills/utils/mapBillRecord";
import { getUserPreferences } from "@/features/preferences/services/user-preferences.service";
import { createApiErrorResponse } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const month = parseRecurringBillMonth(requestUrl.searchParams.get("month"));
    const { start, end } = getBillMonthRange(month);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const [bills, preferences] = await Promise.all([
      listRecurringBills(supabase),
      getUserPreferences(supabase, user.id),
    ]);
    const occurrences = buildRecurringBillOccurrences(bills, start, end);
    const summary = summarizeRecurringBills(bills, month, preferences.primaryCurrencyCode);

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ bills: typeof bills; occurrences: typeof occurrences; summary: typeof summary }>>({
      data: {
        bills,
        occurrences,
        summary,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected recurring bills error.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = createRecurringBillSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const user = await requireAuthenticatedUser(supabase);
    const bill = await createRecurringBill(supabase, user.id, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof bill>>(
      { data: bill },
      { status: 201 }
    ));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected recurring bill creation error.");
  }
}
