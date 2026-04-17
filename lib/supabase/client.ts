import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/config";

export function getSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
