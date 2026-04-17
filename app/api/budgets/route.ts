import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { createBudget, getBudgetSummary, listBudgets } from "@/features/budgets/services/budget.service";
import { createBudgetSchema, budgetQuerySchema } from "@/features/budgets/schemas/budget.schema";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { Budget, BudgetSummary } from "@/features/budgets/types/Budget";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = budgetQuerySchema.parse({
      period: searchParams.get("period") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });

    const { supabase } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const [budgets, summary] = await Promise.all([
      listBudgets(supabase, query),
      getBudgetSummary(supabase, query),
    ]);

    return NextResponse.json<ApiSuccessResponse<{ budgets: Budget[]; summary: BudgetSummary }>>({
      data: {
        budgets,
        summary,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createBudgetSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    await requireAuthenticatedUser(supabase);
    const budget = await createBudget(supabase, payload);

    return applyCookies(NextResponse.json<ApiSuccessResponse<typeof budget>>(
      { data: budget },
      { status: 201 }
    ));
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
          message:
            firstFieldError ??
            firstFormError ??
            "Invalid budget request payload.",
          details: flattened,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === "Authentication required.") {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: error.message,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected budget service error.",
      },
    },
    { status: 500 }
  );
}
