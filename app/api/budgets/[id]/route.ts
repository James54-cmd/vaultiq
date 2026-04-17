import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  deleteBudget,
  updateBudget,
} from "@/features/budgets/services/budget.service";
import {
  budgetIdSchema,
  updateBudgetSchema,
} from "@/features/budgets/schemas/budget.schema";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const budgetId = budgetIdSchema.parse(id);
    const payload = updateBudgetSchema.parse(await request.json());
    const budget = await updateBudget(budgetId, payload);

    if (!budget) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Budget not found.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiSuccessResponse<typeof budget>>({
      data: budget,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const budgetId = budgetIdSchema.parse(id);
    const deleted = await deleteBudget(budgetId);

    if (!deleted) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Budget not found.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiSuccessResponse<{ deleted: true }>>({
      data: {
        deleted: true,
      },
    });
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

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected budget service error.",
      },
    },
    { status: 500 }
  );
}
