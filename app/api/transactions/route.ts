import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createTransactionSchema, transactionQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import {
  createTransaction,
  listTransactions,
} from "@/features/transactions/services/transaction.service";
import { createApiErrorResponse } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { TransactionListResponse } from "@/features/transactions/types/Transaction";
import type { ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = transactionQuerySchema.parse({
      bankName: searchParams.get("bankName") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const { supabase } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const result = await listTransactions(supabase, query);

    return NextResponse.json<ApiSuccessResponse<TransactionListResponse>>({
      data: result,
    });
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected transaction service error.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = createTransactionSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const transaction = await createTransaction(supabase, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof transaction>>(
      { data: transaction },
      { status: 201 }
    ));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected transaction creation error.");
  }
}
