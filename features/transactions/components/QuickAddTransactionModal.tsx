"use client";

import { useEffect, useState } from "react";

import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { createManualTransactionFormSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  supportedBanks,
  transactionCategories,
  transactionDirections,
  transactionStatuses,
} from "@/features/transactions/constants/transaction.constants";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import type { CreateManualTransactionInput, CreateManualTransactionFormInput } from "@/features/transactions/types/Transaction";
import { ApiValidationError } from "@/lib/api-errors";

type QuickAddTransactionModalProps = {
  triggerLabel?: string;
  onSubmit: (input: CreateManualTransactionInput | CreateManualTransactionFormInput) => Promise<void>;
};

const initialValues: CreateManualTransactionFormInput = {
  direction: "expense",
  amount: "",
  currencyCode: "PHP",
  bankName: "GCash",
  merchant: "",
  description: "",
  category: "uncategorized",
  referenceNumber: "",
  notes: "",
  status: "completed",
  happenedAt: new Date().toISOString().slice(0, 10),
};

export function QuickAddTransactionModal({
  triggerLabel = "Quick Add",
  onSubmit,
}: QuickAddTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreateManualTransactionFormInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
      setFieldErrors({});
      setFormError(null);
      setIsPending(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent
        className="flex w-[400px] max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised p-0 text-foreground"
        style={{ maxHeight: "calc(100vh - 32px)" }}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="text-base font-semibold text-foreground">
            Quick Add Transaction
          </DialogTitle>
          <DialogDescription className="text-sm text-muted">
            Log manual cash spend, income, or transfers without waiting for a receipt email.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsPending(true);
            setFieldErrors({});
            setFormError(null);

            const parsed = createManualTransactionFormSchema.safeParse(values);
            if (!parsed.success) {
              const flattened = parsed.error.flatten();
              setFieldErrors(flattened.fieldErrors);
              setFormError(flattened.formErrors[0] ?? null);
              setIsPending(false);
              return;
            }

            try {
              await onSubmit(parsed.data);
              setOpen(false);
            } catch (submitError) {
              if (submitError instanceof ApiValidationError) {
                setFieldErrors(submitError.fieldErrors ?? {});
                setFormError(submitError.formErrors?.[0] ?? submitError.message);
              } else {
                setFormError(
                  submitError instanceof Error ? submitError.message : "Failed to save transaction."
                );
              }
            } finally {
              setIsPending(false);
            }
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Transaction Details</p>
                  <p className="mt-0.5 text-xs text-muted">Set the movement type, amount, and source account.</p>
                </div>
                <hr />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-direction" className="text-xs text-muted">Direction</Label>
                    <Select
                      value={values.direction}
                      onValueChange={(value) =>
                        setValues((c) => ({ ...c, direction: value as CreateManualTransactionFormInput["direction"] }))
                      }
                    >
                      <SelectTrigger id="transaction-direction" className="h-9 text-sm">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionDirections.map((direction) => (
                          <SelectItem key={direction} value={direction}>
                            {formatTransactionLabel(direction)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.direction?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-amount" className="text-xs text-muted">Amount</Label>
                    <CurrencyInput
                      id="transaction-amount"
                      value={values.amount}
                      currencyCode={values.currencyCode}
                      onChange={(event) =>
                        setValues((c) => ({ ...c, amount: event.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.amount?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-date" className="text-xs text-muted">Transaction Date</Label>
                    <DatePicker
                      value={values.happenedAt}
                      onChange={(value) =>
                        setValues((c) => ({ ...c, happenedAt: value }))
                      }
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.happenedAt?.[0]} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-bank" className="text-xs text-muted">Bank</Label>
                    <Select
                      value={values.bankName}
                      onValueChange={(value) =>
                        setValues((c) => ({ ...c, bankName: value as CreateManualTransactionFormInput["bankName"] }))
                      }
                    >
                      <SelectTrigger id="transaction-bank" className="h-9 text-sm">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedBanks.map((bankName) => (
                          <SelectItem key={bankName} value={bankName}>{bankName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.bankName?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-category" className="text-xs text-muted">Category</Label>
                    <Select
                      value={values.category}
                      onValueChange={(value) =>
                        setValues((c) => ({ ...c, category: value as CreateManualTransactionFormInput["category"] }))
                      }
                    >
                      <SelectTrigger id="transaction-category" className="h-9 text-sm">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-status" className="text-xs text-muted">Status</Label>
                    <Select
                      value={values.status}
                      onValueChange={(value) =>
                        setValues((c) => ({ ...c, status: value as CreateManualTransactionFormInput["status"] }))
                      }
                    >
                      <SelectTrigger id="transaction-status" className="h-9 text-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatTransactionLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.status?.[0]} />
                  </div>
                </div>
              </div>

              {/* ── Ledger Context ── */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Ledger Context</p>
                  <p className="mt-0.5 text-xs text-muted">Add the merchant, summary, and optional reconciliation notes.</p>
                </div>
                <hr />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-merchant" className="text-xs text-muted">Merchant</Label>
                    <Input
                      id="transaction-merchant"
                      value={values.merchant}
                      onChange={(event) =>
                        setValues((c) => ({ ...c, merchant: event.target.value }))
                      }
                      placeholder="Meralco, Grab, Cash Deposit"
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.merchant?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-reference" className="text-xs text-muted">Reference Number</Label>
                    <Input
                      id="transaction-reference"
                      value={values.referenceNumber ?? ""}
                      onChange={(event) =>
                        setValues((c) => ({ ...c, referenceNumber: event.target.value }))
                      }
                      placeholder="Optional"
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.referenceNumber?.[0]} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transaction-description" className="text-xs text-muted">Description</Label>
                  <Input
                    id="transaction-description"
                    value={values.description}
                    onChange={(event) =>
                      setValues((c) => ({ ...c, description: event.target.value }))
                    }
                    placeholder="Short summary for the ledger"
                    className="h-9 text-sm"
                  />
                  <FieldError message={fieldErrors.description?.[0]} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transaction-notes" className="text-xs text-muted">Notes</Label>
                  <Textarea
                    id="transaction-notes"
                    value={values.notes ?? ""}
                    onChange={(event) =>
                      setValues((c) => ({ ...c, notes: event.target.value }))
                    }
                    placeholder="Optional context for future reconciliation"
                    rows={3}
                    className="w-full resize-none text-sm"
                  />
                  <FieldError message={fieldErrors.notes?.[0]} />
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <div className="flex w-full flex-col gap-3 py-2 sm:flex-row sm:justify-end">
              {formError ? <FieldError message={formError} /> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}