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
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 rounded-[24px] border border-border/80 bg-surface p-0 text-foreground shadow-[0_24px_64px_rgba(11,18,32,0.2)]">
        <AlertDialogHeader className="gap-3 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/80 to-background/45 px-5 py-5 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10 text-secondary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
            Review Save
          </p>
          <AlertDialogTitle className="text-base font-semibold sm:text-lg">
            Keep this transaction credible?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted">
            Only the merchant, category, and notes will change. Core ledger facts like amount, bank,
            source, status, reference, and transaction date stay locked so the record remains traceable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-border/70 bg-surface/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-surface/82">
          <AlertDialogCancel
            className="mt-0 w-full border-border bg-surface text-foreground hover:bg-accent-muted sm:w-auto"
            disabled={isPending}
          >
            Review Again
          </AlertDialogCancel>
          <AlertDialogAction
            className="w-full bg-slate-900 text-slate-50 hover:bg-slate-900/90 sm:w-auto"
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
