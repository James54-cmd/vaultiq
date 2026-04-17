import type { User } from "@supabase/supabase-js";

import type { AuthUser } from "@/features/auth/types/Auth";

export function mapAuthUser(user: User | null): AuthUser | null {
  if (!user?.email) {
    return null;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return {
    id: user.id,
    email: user.email,
    fullName,
  };
}
