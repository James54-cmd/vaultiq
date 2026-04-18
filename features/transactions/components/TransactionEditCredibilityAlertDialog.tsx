"use client";

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
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 rounded-[22px] border border-border/80 bg-surface p-0 text-foreground shadow-[0_24px_64px_rgba(11,18,32,0.18)]">
        <AlertDialogHeader className="gap-2 border-b border-border/60 bg-background/95 px-4 py-4 text-left sm:px-5">
          <AlertDialogTitle className="text-base font-semibold sm:text-lg">
            Save these changes?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-5 text-muted">
            Only the merchant, category, and notes will be updated. Amount, bank, source, status,
            reference, and transaction date stay locked for audit traceability.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-border/70 bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/82 sm:px-5 sm:py-4">
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
