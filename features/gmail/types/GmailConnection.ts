import type { z } from "zod";

import type {
  gmailConnectionStatusSchema,
  gmailConnectionSummarySchema,
} from "@/features/gmail/schemas/gmail-connection.schema";

export type GmailConnectionRecord = {
  id: string;
  user_id: string;
  provider: "google";
  provider_user_id: string | null;
  email: string;
  refresh_token: string | null;
  access_token: string | null;
  token_expiry_at: string | null;
  scopes: string[];
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GmailConnection = {
  id: string;
  userId: string;
  provider: "google";
  providerUserId: string | null;
  email: string;
  refreshToken: string | null;
  accessToken: string | null;
  tokenExpiryAt: string | null;
  scopes: string[];
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmailConnectionSummary = z.infer<typeof gmailConnectionSummarySchema>;
export type GmailConnectionStatus = z.infer<typeof gmailConnectionStatusSchema>;
