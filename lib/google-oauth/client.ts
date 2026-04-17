import "server-only";

import { google } from "googleapis";

import { getGoogleOauthEnv } from "@/lib/google-oauth/config";

export function createGoogleOauthClient(redirectUri?: string) {
  const env = getGoogleOauthEnv();

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}
