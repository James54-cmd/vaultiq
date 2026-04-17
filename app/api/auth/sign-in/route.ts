import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { signInSchema } from "@/features/auth/schemas/auth.schema";
import { signInWithPassword } from "@/features/auth/services/auth.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { AuthSuccessResponse } from "@/features/auth/types/Auth";

export async function POST(request: Request) {
  try {
    const payload = signInSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const result = await signInWithPassword(supabase, payload);

    return applyCookies(
      NextResponse.json<ApiSuccessResponse<AuthSuccessResponse>>({
        data: result,
      })
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
          message: firstFieldError ?? firstFormError ?? "Invalid sign-in payload.",
          details: flattened,
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected sign-in error.",
      },
    },
    { status: 500 }
  );
}
