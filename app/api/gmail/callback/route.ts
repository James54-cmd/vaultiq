import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireAuthenticatedUser } from "@/features/auth/services/auth-session.service";
import { upsertGmailConnection } from "@/features/gmail/services/gmail-connection.service";
import {
  exchangeGmailAuthorizationCode,
  fetchGmailAccountEmail,
  getGmailOauthStateCookieName,
  parseGmailOauthState,
} from "@/features/gmail/services/gmail-oauth.service";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

function buildRedirectUrl(request: Request, nextPath: string, error?: string) {
  const target = new URL(nextPath, request.url);

  if (error) {
    target.searchParams.set("gmail_error", error);
  }

  return target;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(getGmailOauthStateCookieName())?.value ?? "";

  if (!code || !state) {
    return NextResponse.redirect(buildRedirectUrl(request, "/transactions", "missing_code"));
  }

  let parsedState;

  try {
    parsedState = parseGmailOauthState(state);
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request, "/transactions", "invalid_state"));
  }

  if (!stateCookie || parsedState.nonce !== stateCookie) {
    return NextResponse.redirect(buildRedirectUrl(request, parsedState.nextPath, "invalid_state"));
  }

  const { supabase, applyCookies } = await createSupabaseRouteHandlerClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const tokens = await exchangeGmailAuthorizationCode(requestUrl.origin, code);

    if (!tokens.accessToken) {
      return NextResponse.redirect(
        buildRedirectUrl(request, parsedState.nextPath, "missing_access_token")
      );
    }

    const email = await fetchGmailAccountEmail(tokens.accessToken);

    await upsertGmailConnection(supabase, {
      userId: user.id,
      email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiryAt: tokens.tokenExpiryAt,
      scopes: tokens.scopes,
    });

    const response = applyCookies(
      NextResponse.redirect(buildRedirectUrl(request, parsedState.nextPath))
    );

    response.cookies.delete(getGmailOauthStateCookieName());
    return response;
  } catch {
    const response = applyCookies(
      NextResponse.redirect(buildRedirectUrl(request, parsedState.nextPath, "connection_failed"))
    );
    response.cookies.delete(getGmailOauthStateCookieName());
    return response;
  }
}
