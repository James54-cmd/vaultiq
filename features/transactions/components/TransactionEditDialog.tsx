"use client";

import { useEffect, useRef, useState } from "react";

import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transactionCategories } from "@/features/transactions/constants/transaction.constants";
import {
  TransactionDialogBody,
  TransactionDialogFooterBar,
  TransactionDialogHeaderFrame,
  TransactionDialogHeading,
  TransactionDialogSection,
  transactionDialogContentClassName,
} from "@/features/transactions/components/TransactionDialogScaffold";
import { updateTransactionEditableFieldsSchema } from "@/features/transactions/schemas/transaction.schema";
import { TransactionEditCredibilityAlertDialog } from "@/features/transactions/components/TransactionEditCredibilityAlertDialog";
import type {
  Transaction,
  UpdateTransactionEditableFieldsInput,
} from "@/features/transactions/types/Transaction";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import { formatDatePickerLabel } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { ApiValidationError } from "@/lib/api-errors";

type TransactionEditDialogProps = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transactionId: string, input: UpdateTransactionEditableFieldsInput) => Promise<void>;
};

type TransactionEditFormValues = {
  merchant: string;
  category: Transaction["category"];
  notes: string;
};

const emptyValues: TransactionEditFormValues = {
  merchant: "",
  category: "uncategorized",
  notes: "",
};

function getInitialValues(transaction: Transaction): TransactionEditFormValues {
  return {
    merchant: transaction.merchant,
    category: transaction.category,
    notes: transaction.notes ?? "",
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function TransactionEditDialog({
  transaction,
  open,
  onOpenChange,
  onSubmit,
}: TransactionEditDialogProps) {
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<TransactionEditFormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open || !transaction) {
      setValues(emptyValues);
      setFieldErrors({});
      setFormError(null);
      setIsPending(false);
      setIsConfirmOpen(false);
      return;
    }

    setValues(getInitialValues(transaction));
    setFieldErrors({});
    setFormError(null);
    setIsPending(false);
    setIsConfirmOpen(false);
    scrollBodyRef.current?.scrollTo({ top: 0 });
  }, [open, transaction]);

  if (!transaction) {
    return null;
  }

  const hasChanges =
    values.merchant.trim() !== transaction.merchant ||
    values.category !== transaction.category ||
    normalizeOptionalText(values.notes) !== (transaction.notes ?? null);

  const validateValues = () => {
    const parsed = updateTransactionEditableFieldsSchema.safeParse({
      merchant: values.merchant,
      category: values.category,
      notes: values.notes,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFieldErrors(flattened.fieldErrors);
      setFormError(flattened.formErrors[0] ?? null);
      return null;
    }

    setFieldErrors({});
    setFormError(null);
    return parsed.data;
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isPending) {
            onOpenChange(nextOpen);
          }
        }}
      >
        <DialogContent
          ref={dialogContentRef}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() => {
              dialogContentRef.current?.focus({ preventScroll: true });
              scrollBodyRef.current?.scrollTo({ top: 0 });
            });
          }}
          className={transactionDialogContentClassName}
        >
          <TransactionDialogHeaderFrame className="pr-8">
            <TransactionDialogHeading
              eyebrow="Ledger Refinement"
              title={<DialogTitle className="text-base font-semibold text-foreground sm:text-lg">Edit Transaction Labels</DialogTitle>}
              description={
                <DialogDescription className="text-sm text-muted">
                  Adjust merchant, category, and notes while keeping the underlying ledger facts locked.
                </DialogDescription>
              }
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-surface-raised/70 px-4 py-3 shadow-sm shadow-slate-950/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Original Amount</p>
                <p className="financial-figure mt-2 text-lg font-semibold text-foreground">
                  {formatCurrency(transaction.signedAmount, transaction.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-raised/70 px-4 py-3 shadow-sm shadow-slate-950/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Bank</p>
                <p className="mt-2 text-sm font-medium text-foreground">{transaction.bankName}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-raised/70 px-4 py-3 shadow-sm shadow-slate-950/5 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Transaction Date</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                </p>
              </div>
            </div>
          </TransactionDialogHeaderFrame>

          {/* Scrollable body */}
          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(event) => {
              event.preventDefault();
              if (!hasChanges) return;
              const parsed = validateValues();
              if (!parsed) return;
              setIsConfirmOpen(true);
            }}
          >
            <TransactionDialogBody
              ref={scrollBodyRef}
              className="scrollbar-hide"
            >
              <div className="space-y-6">
                <div className="rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Locked fields protect the audit trail.</p>
                  <p className="pt-1 text-xs text-muted">
                    Amount, bank, source, reference, status, description, and dates are intentionally
                    read-only to keep each transaction credible.
                  </p>
                </div>

                <TransactionDialogSection
                  title="Audit-Locked Fields"
                  description="These values stay read-only so the record remains traceable to the original entry."
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-source" className="text-xs text-muted">Source</Label>
                      <Input
                        id="transaction-edit-source"
                        value={formatTransactionLabel(transaction.source)}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-direction" className="text-xs text-muted">Direction</Label>
                      <Input
                        id="transaction-edit-direction"
                        value={transaction.kindLabel}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-amount" className="text-xs text-muted">Amount</Label>
                      <Input
                        id="transaction-edit-amount"
                        value={formatCurrency(transaction.signedAmount, transaction.currencyCode)}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-date" className="text-xs text-muted">Transaction Date</Label>
                      <Input
                        id="transaction-edit-date"
                        value={formatDatePickerLabel(transaction.happenedAt.slice(0, 10))}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-bank" className="text-xs text-muted">Bank</Label>
                      <Input
                        id="transaction-edit-bank"
                        value={transaction.bankName}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-status" className="text-xs text-muted">Status</Label>
                      <Input
                        id="transaction-edit-status"
                        value={formatTransactionLabel(transaction.status)}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-reference" className="text-xs text-muted">Reference Number</Label>
                      <Input
                        id="transaction-edit-reference"
                        value={transaction.referenceNumber ?? "No reference number"}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-updated-at" className="text-xs text-muted">Last Updated</Label>
                      <Input
                        id="transaction-edit-updated-at"
                        value={new Date(transaction.updatedAt).toLocaleString("en-PH")}
                        disabled
                        className="h-9 text-sm disabled:opacity-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-edit-description" className="text-xs text-muted">Description</Label>
                    <Textarea
                      id="transaction-edit-description"
                      value={transaction.description}
                      disabled
                      rows={3}
                      className="w-full resize-none text-sm disabled:opacity-100"
                    />
                  </div>
                </TransactionDialogSection>

                <TransactionDialogSection
                  title="Editable Labels"
                  description="These are the only fields that can be refined after a transaction has been recorded."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-merchant" className="text-xs text-muted">Merchant</Label>
                      <Input
                        id="transaction-edit-merchant"
                        value={values.merchant}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, merchant: event.target.value }))
                        }
                        placeholder="Update the merchant label"
                        className="h-9 text-sm"
                      />
                      <FieldError message={fieldErrors.merchant?.[0]} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transaction-edit-category" className="text-xs text-muted">Category</Label>
                      <Select
                        value={values.category}
                        onValueChange={(value) =>
                          setValues((current) => ({
                            ...current,
                            category: value as Transaction["category"],
                          }))
                        }
                      >
                        <SelectTrigger id="transaction-edit-category" className="h-9 text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {formatTransactionLabel(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={fieldErrors.category?.[0]} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-edit-notes" className="text-xs text-muted">Notes</Label>
                    <Textarea
                      id="transaction-edit-notes"
                      value={values.notes}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional reconciliation context"
                      rows={4}
                      className="w-full resize-none text-sm"
                    />
                    <FieldError message={fieldErrors.notes?.[0]} />
                  </div>
                </TransactionDialogSection>
              </div>
            </TransactionDialogBody>

            <TransactionDialogFooterBar>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {formError ? <FieldError message={formError} /> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !hasChanges}>
                    Review Changes
                  </Button>
                </div>
              </div>
            </TransactionDialogFooterBar>
          </form>
        </DialogContent>
      </Dialog>

      <TransactionEditCredibilityAlertDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        isPending={isPending}
        onConfirm={async () => {
          const parsed = validateValues();
          if (!parsed) {
            setIsConfirmOpen(false);
            return;
          }

          setIsPending(true);

          try {
            await onSubmit(transaction.id, parsed);
            setIsConfirmOpen(false);
            onOpenChange(false);
          } catch (submitError) {
            if (submitError instanceof ApiValidationError) {
              setFieldErrors(submitError.fieldErrors ?? {});
              setFormError(submitError.formErrors?.[0] ?? submitError.message);
            } else {
              setFormError(
                submitError instanceof Error ? submitError.message : "Failed to update transaction."
              );
            }
            setIsConfirmOpen(false);
          } finally {
            setIsPending(false);
          }
        }}
      />
    </>
  );
}
