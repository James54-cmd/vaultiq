import type { GmailConnection, GmailConnectionRecord } from "@/features/gmail/types/GmailConnection";

export function mapGmailConnectionRecord(record: GmailConnectionRecord): GmailConnection {
  return {
    id: record.id,
    userId: record.user_id,
    provider: record.provider,
    providerUserId: record.provider_user_id,
    email: record.email,
    refreshToken: record.refresh_token,
    accessToken: record.access_token,
    tokenExpiryAt: record.token_expiry_at,
    scopes: record.scopes ?? [],
    lastSyncedAt: record.last_synced_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
