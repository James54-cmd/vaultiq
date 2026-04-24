"use client";

import { useEffect, useState } from "react";

import { GmailSyncSummaryPanel } from "@/features/transactions/components/GmailSyncSummaryPanel";
import { GmailTransactionReviewDialog } from "@/features/transactions/components/GmailTransactionReviewDialog";
import type {
  GmailSyncResult,
  GmailSyncReviewCommitResult,
} from "@/features/transactions/types/Transaction";

type GmailSyncReviewFlowProps = {
  result: GmailSyncResult | null;
  isPending?: boolean;
  onResultChange: (result: GmailSyncResult | null) => void;
  onCommitReview: (reviewBatchId: string, selectedReviewItemIds: string[]) => Promise<GmailSyncReviewCommitResult>;
  onAfterCommit?: () => void;
};

export function GmailSyncReviewFlow({
  result,
  isPending = false,
  onResultChange,
  onCommitReview,
  onAfterCommit,
}: GmailSyncReviewFlowProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewBatchId = result?.reviewBatchId ?? null;

  useEffect(() => {
    if (result?.reviewItems.length) {
      setReviewOpen(true);
    }
  }, [reviewBatchId, result?.reviewItems.length]);

  if (!result) {
    return null;
  }

  return (
    <>
      <GmailSyncSummaryPanel result={result} />

      <GmailTransactionReviewDialog
        open={reviewOpen}
        reviewBatchId={reviewBatchId}
        items={result.reviewItems}
        isPending={isPending}
        onOpenChange={setReviewOpen}
        onCommit={async (selectedReviewItemIds) => {
          const commitResult = await onCommitReview(result.reviewBatchId ?? "", selectedReviewItemIds);

          onResultChange({
            ...result,
            insertedCount: commitResult.confirmedCount,
            reviewItemCount: 0,
            reviewItems: [],
            transactions: commitResult.transactions,
          });
          onAfterCommit?.();

          return commitResult;
        }}
      />
    </>
  );
}
