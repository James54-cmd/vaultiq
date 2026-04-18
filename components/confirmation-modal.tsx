"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-border bg-surface-raised px-4 py-6 text-foreground sm:px-6 sm:py-8">
        <DialogHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-error/20 bg-error/10 text-error">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="bg-error text-background hover:brightness-110"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            disabled={isPending}
          >
            {isPending ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
