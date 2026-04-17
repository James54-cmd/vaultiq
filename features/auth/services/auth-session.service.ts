import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mapAuthUser } from "@/features/auth/utils/mapAuthUser";

export async function requireAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Authentication required.");
  }

  const mappedUser = mapAuthUser(user);
  if (!mappedUser) {
    throw new Error("Authenticated user is missing required account data.");
  }

  return mappedUser;
}
