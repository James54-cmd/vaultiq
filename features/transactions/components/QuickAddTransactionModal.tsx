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
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border-border bg-surface-raised p-0 text-foreground"
        style={{ maxHeight: "calc(100vh - 32px)" }}
      >
        <DialogHeader className="sticky top-0 z-10 gap-2 border-b border-border bg-surface-raised px-4 py-4 sm:px-6">
          <DialogTitle className="pr-10 text-xl font-semibold tracking-tightest text-foreground">
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
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Transaction Details</p>
                  <p className="text-xs text-muted">Set the movement type, amount, and source account.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-direction">Direction</Label>
                    <Select
                      value={values.direction}
                      onValueChange={(value) =>
                        setValues((current) => ({
                          ...current,
                          direction: value as CreateManualTransactionFormInput["direction"],
                        }))
                      }
                    >
                      <SelectTrigger id="transaction-direction">
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

                  <div className="space-y-2">
                    <Label htmlFor="transaction-amount">Amount</Label>
                    <CurrencyInput
                      id="transaction-amount"
                      value={values.amount}
                      currencyCode={values.currencyCode}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, amount: event.target.value }))
                      }
                    />
                    <FieldError message={fieldErrors.amount?.[0]} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction-date">Transaction Date</Label>
                    <DatePicker
                      value={values.happenedAt}
                      onChange={(value) =>
                        setValues((current) => ({ ...current, happenedAt: value }))
                      }
                    />
                    <FieldError message={fieldErrors.happenedAt?.[0]} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction-bank">Bank</Label>
                    <Select
                      value={values.bankName}
                      onValueChange={(value) =>
                        setValues((current) => ({
                          ...current,
                          bankName: value as CreateManualTransactionFormInput["bankName"],
                        }))
                      }
                    >
                      <SelectTrigger id="transaction-bank">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedBanks.map((bankName) => (
                          <SelectItem key={bankName} value={bankName}>
                            {bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.bankName?.[0]} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction-category">Category</Label>
                    <Select
                      value={values.category}
                      onValueChange={(value) =>
                        setValues((current) => ({
                          ...current,
                          category: value as CreateManualTransactionFormInput["category"],
                        }))
                      }
                    >
                      <SelectTrigger id="transaction-category">
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

                  <div className="space-y-2">
                    <Label htmlFor="transaction-status">Status</Label>
                    <Select
                      value={values.status}
                      onValueChange={(value) =>
                        setValues((current) => ({
                          ...current,
                          status: value as CreateManualTransactionFormInput["status"],
                        }))
                      }
                    >
                      <SelectTrigger id="transaction-status">
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
              </section>

              <section className="space-y-4 border-t border-border pt-6">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ledger Context</p>
                  <p className="text-xs text-muted">Add the merchant, summary, and optional reconciliation notes.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-merchant">Merchant</Label>
                    <Input
                      id="transaction-merchant"
                      value={values.merchant}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, merchant: event.target.value }))
                      }
                      placeholder="Meralco, Grab, Cash Deposit"
                    />
                    <FieldError message={fieldErrors.merchant?.[0]} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction-reference">Reference Number</Label>
                    <Input
                      id="transaction-reference"
                      value={values.referenceNumber ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, referenceNumber: event.target.value }))
                      }
                      placeholder="Optional"
                    />
                    <FieldError message={fieldErrors.referenceNumber?.[0]} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transaction-description">Description</Label>
                    <Input
                      id="transaction-description"
                      value={values.description}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Short summary for the ledger"
                    />
                    <FieldError message={fieldErrors.description?.[0]} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transaction-notes">Notes</Label>
                    <Textarea
                      id="transaction-notes"
                      value={values.notes ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional context for future reconciliation"
                      rows={5}
                    />
                    <FieldError message={fieldErrors.notes?.[0]} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 z-10 border-t border-border bg-surface-raised px-4 py-4 sm:px-6">
            <div className="flex w-full flex-col gap-3">
              {formError ? <FieldError message={formError} /> : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
