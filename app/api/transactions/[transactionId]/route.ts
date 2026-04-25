import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { transactionIdSchema, updateTransactionSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@/features/transactions/services/transaction.service";
import { createApiErrorResponse, createNotFoundApiError } from "@/lib/api-route-errors";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiSuccessResponse } from "@/types/api";

type TransactionRouteContext = {
  params: Promise<{
    transactionId: string;
  }>;
};

export async function GET(_request: Request, context: TransactionRouteContext) {
  try {
    const { transactionId } = await context.params;
    const parsedTransactionId = transactionIdSchema.parse(transactionId);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const transaction = await getTransactionById(supabase, parsedTransactionId);

    if (!transaction) {
      return createNotFoundApiError("Transaction not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof transaction>>({
      data: transaction,
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected transaction detail error.");
  }
}

export async function PATCH(request: Request, context: TransactionRouteContext) {
  try {
    const { transactionId } = await context.params;
    const parsedTransactionId = transactionIdSchema.parse(transactionId);
    const payload = updateTransactionSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const transaction = await updateTransaction(supabase, parsedTransactionId, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof transaction>>({
      data: transaction,
    }));
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found.") {
      return createNotFoundApiError(error.message);
    }

    return createApiErrorResponse(error, "Unexpected transaction update error.");
  }
}

export async function DELETE(_request: Request, context: TransactionRouteContext) {
  try {
    const { transactionId } = await context.params;
    const parsedTransactionId = transactionIdSchema.parse(transactionId);
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const deleted = await deleteTransaction(supabase, parsedTransactionId);

    if (!deleted) {
      return createNotFoundApiError("Transaction not found.");
    }

    return applyCookies(NextResponse.json<ApiSuccessResponse<{ deleted: true }>>({
      data: {
        deleted: true,
      },
    }));
  } catch (error) {
    return createApiErrorResponse(error, "Unexpected transaction deletion error.");
  }
}
