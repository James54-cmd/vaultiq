import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { executeBudgetGraphqlOperation } from "@/features/budgets/graphql/budget.schema";
import { graphQLRequestSchema } from "@/schemas/graphql-request.schema";
import type { ApiErrorResponse } from "@/types/api";

export async function POST(request: Request) {
  try {
    const payload = graphQLRequestSchema.parse(await request.json());
    const result = await executeBudgetGraphqlOperation(payload);

    const status = result.errors?.length ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            message: "Invalid GraphQL request payload.",
            details: error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          message: "Unexpected GraphQL execution error.",
        },
      },
      { status: 500 }
    );
  }
}
