import "server-only";

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const gmailApiTimeoutMs = 15_000;
const gmailApiMaxAttempts = 3;
const retryableStatusCodes = new Set([408, 429, 500, 502, 503, 504]);

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

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function gmailApiFetch(
  accessToken: string,
  url: string,
  failureLabel: string
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= gmailApiMaxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), gmailApiTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: buildHeaders(accessToken),
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 401) {
        throw new Error("Gmail authorization expired. Please reconnect Gmail and try again.");
      }

      if (attempt < gmailApiMaxAttempts && retryableStatusCodes.has(response.status)) {
        await wait(attempt * 400);
        continue;
      }

      throw new Error(`${failureLabel} (HTTP ${response.status}).`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (
        attempt < gmailApiMaxAttempts &&
        (lastError instanceof TypeError || isAbortError(lastError))
      ) {
        await wait(attempt * 400);
        continue;
      }

      if (isAbortError(lastError)) {
        throw new Error(`${failureLabel} timed out while contacting Gmail.`);
      }

      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error(failureLabel);
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

  const response = await gmailApiFetch(
    accessToken,
    `${GMAIL_API_BASE_URL}/messages?${searchParams.toString()}`,
    "Failed to list Gmail messages"
  );

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

  const response = await gmailApiFetch(
    accessToken,
    `${GMAIL_API_BASE_URL}/messages/${messageId}?${searchParams.toString()}`,
    `Failed to fetch Gmail message details for ${messageId}`
  );

  return (await response.json()) as GmailMessageDetail;
}
