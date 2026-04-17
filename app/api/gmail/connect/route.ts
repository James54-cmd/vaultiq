import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import {
  createGmailAuthorizationUrl,
  createGmailOauthState,
  getGmailOauthStateCookieName,
} from "@/features/gmail/services/gmail-oauth.service";
import { isGmailSyncEnabled } from "@/lib/app-config";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/transactions";

  if (!isGmailSyncEnabled()) {
    return NextResponse.redirect(
      new URL(`${safeNextPath}?gmail_error=disabled`, request.url)
    );
  }

  const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();

  try {
    await requireAuthenticatedUser(supabase);
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_required", request.url));
  }

  const { cookieValue, state } = createGmailOauthState(safeNextPath);
  const authorizationUrl = createGmailAuthorizationUrl(requestUrl.origin, state);
  const response = applyCookies(NextResponse.redirect(authorizationUrl));

  response.cookies.set(getGmailOauthStateCookieName(), cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
