import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { signUpSchema } from "@/features/auth/schemas/auth.schema";
import { signUpWithPassword } from "@/features/auth/services/auth.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { AuthSuccessResponse } from "@/features/auth/types/Auth";

export async function POST(request: Request) {
  try {
    const payload = signUpSchema.parse(await request.json());
    const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
    const result = await signUpWithPassword(supabase, payload);

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
          message: firstFieldError ?? firstFormError ?? "Invalid sign-up payload.",
          details: flattened,
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        message: error instanceof Error ? error.message : "Unexpected sign-up error.",
      },
    },
    { status: 500 }
  );
}
