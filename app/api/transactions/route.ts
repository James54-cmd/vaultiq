import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createManualTransactionSchema, transactionQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import {
  createManualTransaction,
  listTransactions,
} from "@/features/transactions/services/transaction.service";
import type {
  TransactionListResponse,
} from "@/features/transactions/types/Transaction";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = transactionQuerySchema.parse({
      bankName: searchParams.get("bankName") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const result = await listTransactions(query);

    return NextResponse.json<ApiSuccessResponse<TransactionListResponse>>({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createManualTransactionSchema.parse(await request.json());
    const transaction = await createManualTransaction(payload);

    return NextResponse.json<ApiSuccessResponse<typeof transaction>>(
      { data: transaction },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const firstFieldError = Object.values(flattened.fieldErrors).flat()[0];
    const firstFormError = flattened.formErrors[0];

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: firstFieldError ?? firstFormError ?? "Invalid transaction request payload.",
          details: flattened,
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected transaction service error.",
      },
    },
    { status: 500 }
  );
}
