"use client";

import { gmailConnectionStatusSchema } from "@/features/gmail/schemas/gmail-connection.schema";
import type { GmailConnectionStatus } from "@/features/gmail/types/GmailConnection";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export async function fetchGmailConnectionStatus() {
  const response = await fetch("/api/gmail/connection", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.error.message);
  }

  const payload = (await response.json()) as ApiSuccessResponse<GmailConnectionStatus>;
  return gmailConnectionStatusSchema.parse(payload.data);
}
