import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import type { GmailConnection, GmailConnectionRecord } from "@/features/gmail/types/GmailConnection";
import { mapGmailConnectionRecord } from "@/features/gmail/utils/mapGmailConnectionRecord";
import { createGoogleOauthClient } from "@/lib/google-oauth/client";

function parseTokenExpiryDate(expiresAt?: number | null) {
  if (!expiresAt) {
    return null;
  }

  return new Date(expiresAt * 1000).toISOString();
}

function parseScopes(session: Session | null) {
  const scopeValue =
    typeof session?.provider_token === "string"
      ? session.user?.user_metadata?.scope
      : session?.user?.user_metadata?.scope;

  if (typeof scopeValue !== "string" || scopeValue.trim().length === 0) {
    return ["https://www.googleapis.com/auth/gmail.readonly"];
  }

  return scopeValue
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function isGoogleFetchFailure(error: unknown) {
  return error instanceof Error && /fetch failed/i.test(error.message);
}

export async function upsertGmailConnectionFromSession(
  supabase: SupabaseClient,
  user: User,
  session: Session | null
) {
  if (!user.email) {
    return null;
  }
  return upsertGmailConnection(supabase, {
    userId: user.id,
    email: user.email,
    providerUserId:
      typeof user.user_metadata?.provider_id === "string"
        ? user.user_metadata.provider_id
        : typeof user.identities?.[0]?.id === "string"
          ? user.identities[0].id
          : null,
    refreshToken: session?.provider_refresh_token ?? null,
    accessToken: session?.provider_token ?? null,
    tokenExpiryAt: parseTokenExpiryDate(session?.expires_at),
    scopes: parseScopes(session),
  });
}

export async function upsertGmailConnection(
  supabase: SupabaseClient,
  input: {
    userId: string;
    email: string;
    providerUserId?: string | null;
    refreshToken?: string | null;
    accessToken?: string | null;
    tokenExpiryAt?: string | null;
    scopes?: string[];
  }
) {
  const existingConnection = await getGmailConnectionForUser(supabase, input.userId);

  const payload = {
    user_id: input.userId,
    provider: "google" as const,
    provider_user_id: input.providerUserId ?? existingConnection?.providerUserId ?? null,
    email: input.email,
    refresh_token: input.refreshToken ?? existingConnection?.refreshToken ?? null,
    access_token: input.accessToken ?? existingConnection?.accessToken ?? null,
    token_expiry_at: input.tokenExpiryAt ?? existingConnection?.tokenExpiryAt ?? null,
    scopes:
      input.scopes && input.scopes.length > 0
        ? input.scopes
        : existingConnection?.scopes ?? ["https://www.googleapis.com/auth/gmail.readonly"],
  };

  const { data, error } = await supabase
    .from("gmail_connections")
    .upsert(payload, { onConflict: "user_id,provider" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapGmailConnectionRecord(data as GmailConnectionRecord);
}

export async function getGmailConnectionForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<GmailConnection | null> {
  const { data, error } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapGmailConnectionRecord(data as GmailConnectionRecord);
}

export async function refreshGmailConnectionAccessToken(
  supabase: SupabaseClient,
  connection: GmailConnection
) {
  if (!connection.refreshToken) {
    throw new Error("Gmail connection is missing a refresh token.");
  }

  const oauthClient = createGoogleOauthClient();
  oauthClient.setCredentials({
    refresh_token: connection.refreshToken,
  });

  let credentials: {
    access_token?: string | null;
    expiry_date?: number | null;
    refresh_token?: string | null;
  };

  try {
    ({ credentials } = await oauthClient.refreshAccessToken());
  } catch (error) {
    if (isGoogleFetchFailure(error)) {
      throw new Error(
        "Failed to refresh Gmail access token because the server could not reach Google. Check the internet connection, DNS, firewall, or Google availability and try again."
      );
    }

    throw error;
  }

  const nextAccessToken = credentials.access_token ?? connection.accessToken;
  const nextExpiryDate = credentials.expiry_date
    ? new Date(credentials.expiry_date).toISOString()
    : connection.tokenExpiryAt;

  const { data, error } = await supabase
    .from("gmail_connections")
    .update({
      access_token: nextAccessToken,
      token_expiry_at: nextExpiryDate,
      refresh_token: credentials.refresh_token ?? connection.refreshToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapGmailConnectionRecord(data as GmailConnectionRecord);
}

export async function getValidGmailAccessToken(
  supabase: SupabaseClient,
  userId: string
) {
  const connection = await getGmailConnectionForUser(supabase, userId);

  if (!connection) {
    throw new Error("Gmail is not connected for this account.");
  }

  const now = Date.now();
  const expiryTime = connection.tokenExpiryAt
    ? new Date(connection.tokenExpiryAt).getTime()
    : 0;

  if (connection.accessToken && expiryTime > now + 60_000) {
    return {
      connection,
      accessToken: connection.accessToken,
    };
  }

  const refreshedConnection = await refreshGmailConnectionAccessToken(supabase, connection);

  if (!refreshedConnection.accessToken) {
    throw new Error("Unable to refresh Gmail access token.");
  }

  return {
    connection: refreshedConnection,
    accessToken: refreshedConnection.accessToken,
  };
}

export async function markGmailConnectionSynced(
  supabase: SupabaseClient,
  connectionId: string
) {
  const { error } = await supabase
    .from("gmail_connections")
    .update({
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message);
  }
}
