"use client";
import { CheckCircle2, Mail, RefreshCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GmailConnectionStatus } from "@/features/gmail/types/GmailConnection";

type GmailConnectionCardProps = {
  status: GmailConnectionStatus;
  isPending?: boolean;
  error?: string | null;
  connectHref: string;
  onSync?: () => Promise<void>;
  syncPending?: boolean;
};

function formatLastSyncedAt(value: string | null) {
  if (!value) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function GmailConnectionCard({
  status,
  isPending = false,
  error,
  connectHref,
  onSync,
  syncPending = false,
}: GmailConnectionCardProps) {
  const connection = status.connection;

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-secondary/20 bg-secondary/10 p-2 text-secondary">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">Gmail Transaction Logging</p>
          </div>

          {status.connected && connection ? (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                Connected as <span className="font-medium">{connection.email}</span>
              </p>
              <p className="text-sm text-muted">
                Last sync: {formatLastSyncedAt(connection.lastSyncedAt)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  Gmail connected
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-secondary">
                  <ShieldCheck className="h-3 w-3" />
                  {connection.hasRefreshToken ? "Refresh token ready" : "Reconnect recommended"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                Connect Gmail to auto-detect “Payment Successful” emails and log them into VaultIQ.
              </p>
              <p className="text-sm text-muted">
                Manual quick add still works even before Gmail is connected.
              </p>
            </div>
          )}

          {error ? <p className="text-sm text-error">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {status.connected && onSync ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onSync}
              disabled={syncPending || isPending}
            >
              <RefreshCcw className="h-4 w-4" />
              {syncPending ? "Syncing..." : "Sync Gmail"}
            </Button>
          ) : null}
          <Button asChild variant={status.connected ? "secondary" : "default"}>
            <a href={connectHref}>
              {status.connected ? "Reconnect Gmail" : "Connect Gmail"}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
