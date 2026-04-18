"use client";

import { ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TransactionEditCredibilityAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
};

export function TransactionEditCredibilityAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: TransactionEditCredibilityAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!isPending) {
        onOpenChange(nextOpen);
      }
    }}>
      <AlertDialogContent className="rounded-xl border-border bg-surface-raised text-foreground">
        <AlertDialogHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-secondary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <AlertDialogTitle>Keep this transaction credible?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted">
            Only the merchant, category, and notes will change. Core ledger facts like amount, bank,
            source, status, reference, and transaction date stay locked so the record remains traceable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-border bg-surface text-foreground hover:bg-accent-muted"
            disabled={isPending}
          >
            Review Again
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-slate-900 text-slate-50 hover:bg-slate-900/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
