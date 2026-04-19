import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  deleteRecurringBill,
  updateRecurringBill,
} from "@/features/bills/services/bill.service";
import { recurringBillIdSchema, updateRecurringBillSchema } from "@/features/bills/schemas/bill.schema";
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
    const billId = recurringBillIdSchema.parse(id);
    const payload = updateRecurringBillSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const bill = await updateRecurringBill(supabase, billId, payload);

    if (!bill) {
      return createNotFoundApiError("Bill not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof bill>>({
      data: bill,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected recurring bill update error.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const billId = recurringBillIdSchema.parse(id);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const deleted = await deleteRecurringBill(supabase, billId);

    if (!deleted) {
      return createNotFoundApiError("Bill not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ deleted: true }>>({
      data: {
        deleted: true,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected recurring bill deletion error.");
  }
}
