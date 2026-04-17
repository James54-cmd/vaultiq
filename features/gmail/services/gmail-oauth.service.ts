import "server-only";

import { randomUUID } from "node:crypto";

import { createGoogleOauthClient } from "@/lib/google-oauth/client";

const GMAIL_OAUTH_STATE_COOKIE = "vaultiq_gmail_oauth_state";
const gmailOAuthScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
] as const;

type GmailOauthState = {
  nonce: string;
  nextPath: string;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function getGmailOauthStateCookieName() {
  return GMAIL_OAUTH_STATE_COOKIE;
}

export function createGmailOauthState(nextPath: string) {
  const payload: GmailOauthState = {
    nonce: randomUUID(),
    nextPath,
  };

  return {
    cookieValue: payload.nonce,
    state: toBase64Url(JSON.stringify(payload)),
  };
}

export function parseGmailOauthState(state: string) {
  const parsed = JSON.parse(fromBase64Url(state)) as Partial<GmailOauthState>;

  return {
    nonce: typeof parsed.nonce === "string" ? parsed.nonce : "",
    nextPath:
      typeof parsed.nextPath === "string" && parsed.nextPath.startsWith("/")
        ? parsed.nextPath
        : "/transactions",
  };
}

export function createGmailAuthorizationUrl(origin: string, state: string) {
  const oauthClient = createGoogleOauthClient(`${origin}/api/gmail/callback`);

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...gmailOAuthScopes],
    state,
  });
}

export async function exchangeGmailAuthorizationCode(origin: string, code: string) {
  const oauthClient = createGoogleOauthClient(`${origin}/api/gmail/callback`);
  const { tokens } = await oauthClient.getToken(code);

  return {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiryAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scopes:
      typeof tokens.scope === "string" && tokens.scope.trim().length > 0
        ? tokens.scope.split(/\s+/).filter(Boolean)
        : ["https://www.googleapis.com/auth/gmail.readonly"],
  };
}

export async function fetchGmailAccountEmail(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load Gmail account profile.");
  }

  const payload = (await response.json()) as {
    emailAddress?: string;
  };

  if (typeof payload.emailAddress !== "string" || payload.emailAddress.length === 0) {
    throw new Error("Connected Gmail account is missing an email address.");
  }

  return payload.emailAddress;
}
