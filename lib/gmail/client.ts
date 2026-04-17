import "server-only";

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailMessageListResponse = {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailMessageListPage = {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken: string | null;
  resultSizeEstimate: number | null;
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

export async function listGmailMessages(
  accessToken: string,
  query: string,
  maxResults: number,
  pageToken?: string | null
): Promise<GmailMessageListPage> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set("maxResults", String(maxResults));

  if (pageToken) {
    searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(`${GMAIL_API_BASE_URL}/messages?${searchParams.toString()}`, {
    method: "GET",
    headers: buildHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to list Gmail messages.");
  }

  const payload = (await response.json()) as GmailMessageListResponse;
  return {
    messages: payload.messages ?? [],
    nextPageToken: payload.nextPageToken ?? null,
    resultSizeEstimate: typeof payload.resultSizeEstimate === "number" ? payload.resultSizeEstimate : null,
  };
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
