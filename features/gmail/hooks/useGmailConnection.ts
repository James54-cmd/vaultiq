"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { fetchGmailConnectionStatus } from "@/features/gmail/services/gmail-api.service";
import type { GmailConnectionStatus } from "@/features/gmail/types/GmailConnection";

export function useGmailConnection(enabled: boolean) {
  const [status, setStatus] = useState<GmailConnectionStatus>({
    connected: false,
    connection: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadConnection = useCallback(() => {
    if (!enabled) {
      setStatus({
        connected: false,
        connection: null,
      });
      setError(null);
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const nextStatus = await fetchGmailConnectionStatus();
        setStatus(nextStatus);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load Gmail connection.");
      }
    });
  }, [enabled]);

  useEffect(() => {
    reloadConnection();
  }, [reloadConnection]);

  return {
    status,
    error,
    isPending,
    reloadConnection,
  };
}
