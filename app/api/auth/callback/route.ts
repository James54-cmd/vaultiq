import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, request.url));
  }

  const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=oauth_callback_failed`, request.url));
  }

  return applyCookies(
    NextResponse.redirect(new URL(safeNextPath, request.url))
  );
}
