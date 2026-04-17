import "server-only";

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailMessageListResponse = {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
};

export type GmailMessageDetail = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    mimeType?: string;
    headers?: Array<{
      name?: string;
      value?: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType?: string;
      body?: {
        data?: string;
      };
      parts?: Array<{
        mimeType?: string;
        body?: {
          data?: string;
        };
      }>;
    }>;
  };
};

function buildHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export function getDefaultGmailSyncSettings() {
  const { getGmailEnv } = require("@/lib/gmail/config");
  const env = getGmailEnv();

  return {
    query: env.GMAIL_SYNC_QUERY,
    maxResults: env.GMAIL_SYNC_MAX_RESULTS,
  };
}

export async function listGmailMessages(
  accessToken: string,
  query: string,
  maxResults: number
) {
  const searchParams = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const response = await fetch(`${GMAIL_API_BASE_URL}/messages?${searchParams.toString()}`, {
    method: "GET",
    headers: buildHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to list Gmail messages.");
  }

  const payload = (await response.json()) as GmailMessageListResponse;
  return payload.messages ?? [];
}

export async function getGmailMessage(accessToken: string, messageId: string) {
  const searchParams = new URLSearchParams({
    format: "full",
  });

  const response = await fetch(
    `${GMAIL_API_BASE_URL}/messages/${messageId}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: buildHeaders(accessToken),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Gmail message details.");
  }

  return (await response.json()) as GmailMessageDetail;
}
