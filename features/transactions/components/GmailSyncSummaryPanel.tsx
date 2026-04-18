"use client";

import type { GmailSyncResult } from "@/features/transactions/types/Transaction";

type GmailSyncSummaryPanelProps = {
  result: GmailSyncResult;
};

function getSummaryMessage(result: GmailSyncResult) {
  if (result.matchedMessageCount === 0) {
    return "No Gmail messages matched the current sync query. Try the same query in Gmail search or broaden it further.";
  }

  if (
    result.existingMessageCount > 0 &&
    result.parsedMessageCount === 0 &&
    result.insertedCount === 0 &&
    result.updatedCount === 0 &&
    result.skippedMessageCount === 0
  ) {
    return "Matched emails were already synced before, so VaultIQ skipped duplicate fetches and writes for this run.";
  }

  if (result.updatedCount > 0 && result.insertedCount > 0) {
    return "Full resync reparsed existing Gmail transactions, backfilled missing fields like references, and added any newly discovered rows.";
  }

  if (result.updatedCount > 0) {
    return "Full resync reparsed existing Gmail transactions and refreshed stored rows with any missing data it could now read.";
  }

  if (result.parsedMessageCount === 0) {
    return "Emails matched, but none contained a supported payment pattern that VaultIQ could parse into a transaction.";
  }

  if (result.skippedMessageCount > 0) {
    return "Some matched emails were skipped because they did not contain a readable payment amount or a supported receipt format.";
  }

  return "Matched emails were parsed and written into your transaction ledger.";
}

export function GmailSyncSummaryPanel({ result }: GmailSyncSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-5">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Last Gmail Sync</p>
          <p className="pt-1 text-sm text-muted">{getSummaryMessage(result)}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Matched</p>
            <p className="financial-figure pt-2 text-xl font-bold text-foreground">
              {result.matchedMessageCount.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Existing</p>
            <p className="financial-figure pt-2 text-xl font-bold text-muted-foreground">
              {result.existingMessageCount.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Parsed</p>
            <p className="financial-figure pt-2 text-xl font-bold text-secondary">
              {result.parsedMessageCount.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">New</p>
            <p className="financial-figure pt-2 text-xl font-bold text-primary">
              {result.insertedCount.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Updated</p>
            <p className="financial-figure pt-2 text-xl font-bold text-secondary">
              {result.updatedCount.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Skipped</p>
            <p className="financial-figure pt-2 text-xl font-bold text-warning">
              {result.skippedMessageCount.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Lookback Window</p>
            <p className="financial-figure pt-2 text-xl font-bold text-foreground">
              {result.daysBack.toFixed(0)} days
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-muted">Pages Scanned</p>
            <p className="financial-figure pt-2 text-xl font-bold text-foreground">
              {result.pagesFetched.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-muted">Query Used</p>
          <p className="pt-2 break-words text-sm text-foreground">{result.query}</p>
        </div>

        {result.skippedMessages.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted">Skipped Samples</p>
            <div className="space-y-2">
              {result.skippedMessages.map((message) => (
                <div
                  key={message.gmailMessageId}
                  className="rounded-lg border border-border bg-background px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">{message.subject}</p>
                  <p className="pt-1 text-xs text-muted">{message.from}</p>
                  <p className="pt-2 text-sm text-warning">{message.reason}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
