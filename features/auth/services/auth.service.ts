import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { signInSchema, signUpSchema } from "@/features/auth/schemas/auth.schema";
import type { AuthSuccessResponse } from "@/features/auth/types/Auth";
import { mapAuthUser } from "@/features/auth/utils/mapAuthUser";

export async function signInWithPassword(
  supabase: SupabaseClient,
  input: unknown
): Promise<AuthSuccessResponse> {
  const parsedInput = signInSchema.parse(input);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsedInput.email,
    password: parsedInput.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: mapAuthUser(data.user),
    requiresEmailConfirmation: false,
    message: "Signed in successfully.",
  };
}

export async function signUpWithPassword(
  supabase: SupabaseClient,
  input: unknown
): Promise<AuthSuccessResponse> {
  const parsedInput = signUpSchema.parse(input);

  const { data, error } = await supabase.auth.signUp({
    email: parsedInput.email,
    password: parsedInput.password,
    options: {
      data: {
        full_name: parsedInput.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const requiresEmailConfirmation = !data.session;

  return {
    user: mapAuthUser(data.user),
    requiresEmailConfirmation,
    message: requiresEmailConfirmation
      ? "Account created. Check your email to confirm your account."
      : "Account created successfully.",
  };
}

export async function signOut(
  supabase: SupabaseClient
): Promise<AuthSuccessResponse> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: null,
    requiresEmailConfirmation: false,
    message: "Signed out successfully.",
  };
}
