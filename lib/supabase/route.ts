import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/config";

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createSupabaseRouteHandlerClient() {
  const env = getSupabaseEnv();
  const cookieStore = await cookies();
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Route handlers can still apply cookies on the response below.
            }
          });
        },
      },
    }
  );

  const applyCookies = <T extends NextResponse>(response: T) => {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  };

  return {
    supabase,
    applyCookies,
  };
}
