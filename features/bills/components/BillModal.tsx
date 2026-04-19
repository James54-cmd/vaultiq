"use client";

import { useState, type FormEvent } from "react";
import { BellRing, Pencil, Plus } from "lucide-react";
import { z } from "zod";

import {
  recurringBillCadenceLabels,
  recurringBillCadences,
  recurringBillStatusLabels,
  recurringBillStatuses,
} from "@/features/bills/constants/bill.constants";
import { createRecurringBillFormSchema } from "@/features/bills/schemas/bill.schema";
import type {
  CreateRecurringBillFormInput,
  CreateRecurringBillInput,
  RecurringBill,
} from "@/features/bills/types/Bill";
import { ApiValidationError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedCurrencyCodes } from "@/lib/currency";

type BillModalProps = {
  bill?: RecurringBill;
  onSubmit: (input: CreateRecurringBillInput) => Promise<void>;
};

const fieldClassName =
  "h-10 rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";
const textareaClassName =
  "min-h-[120px] rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";

const initialFormState: CreateRecurringBillFormInput = {
  name: "",
  category: "",
  amount: "",
  currencyCode: "PHP",
  cadence: "monthly",
  anchorDate: "",
  reminderDaysBefore: 3,
  autopay: false,
  status: "active",
  notes: "",
};

function toFormState(bill?: RecurringBill): CreateRecurringBillFormInput {
  if (!bill) {
    return initialFormState;
  }

  return {
    name: bill.name,
    category: bill.category,
    amount: bill.amount.toFixed(2),
    currencyCode: bill.currencyCode,
    cadence: bill.cadence,
    anchorDate: bill.anchorDate,
    reminderDaysBefore: bill.reminderDaysBefore,
    autopay: bill.autopay,
    status: bill.status,
    notes: bill.notes ?? "",
  };
}

export function BillModal({ bill, onSubmit }: BillModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateRecurringBillFormInput>(toFormState(bill));
  const isEditMode = Boolean(bill);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      const payload = createRecurringBillFormSchema.parse(formState);
      await onSubmit(payload);
      setFormState(initialFormState);
      setOpen(false);
    } catch (submitError) {
      if (submitError instanceof z.ZodError) {
        const flattened = submitError.flatten();
        const nextFieldErrors = Object.fromEntries(
          Object.entries(flattened.fieldErrors).flatMap(([key, value]) =>
            value && value[0] ? [[key, value[0]]] : []
          )
        );
        setFieldErrors(nextFieldErrors);
        setError(flattened.formErrors[0] ?? null);
      } else if (submitError instanceof ApiValidationError) {
        const nextFieldErrors = Object.fromEntries(
          Object.entries(submitError.fieldErrors ?? {}).flatMap(([key, value]) =>
            value && value[0] ? [[key, value[0]]] : []
          )
        );
        setFieldErrors(nextFieldErrors);
        setError(submitError.formErrors?.[0] ?? submitError.message);
      } else {
        setError(submitError instanceof Error ? submitError.message : "Unable to save recurring bill.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFormState(toFormState(bill));
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        {bill ? (
          <Button variant="secondary" size="icon" aria-label="Edit bill">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl border-border bg-surface-raised p-0 text-foreground">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
            {isEditMode ? "Edit Bill" : "Create Bill"}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted">
            Capture subscriptions, utilities, and fixed obligations in a single reminder calendar.
          </DialogDescription>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bill-name" className="text-xs text-muted">Bill Name</Label>
              <Input
                id="bill-name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Netflix, Electricity, Internet"
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bill-category" className="text-xs text-muted">Category</Label>
              <Input
                id="bill-category"
                value={formState.category}
                onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                placeholder="Subscriptions, Utilities"
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.category} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Currency</Label>
              <Select
                value={formState.currencyCode}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, currencyCode: value as RecurringBill["currencyCode"] }))
                }
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencyCodes.map((currencyCode) => (
                    <SelectItem key={currencyCode} value={currencyCode}>
                      {currencyCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.currencyCode} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="bill-amount" className="text-xs text-muted">Amount</Label>
              <CurrencyInput
                id="bill-amount"
                value={formState.amount}
                onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.amount} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Cadence</Label>
              <Select
                value={formState.cadence}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, cadence: value as RecurringBill["cadence"] }))
                }
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurringBillCadences.map((cadence) => (
                    <SelectItem key={cadence} value={cadence}>
                      {recurringBillCadenceLabels[cadence]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.cadence} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Anchor Date</Label>
              <DatePicker
                value={formState.anchorDate}
                onChange={(value) => setFormState((current) => ({ ...current, anchorDate: value }))}
                placeholder="First due date"
              />
              <FieldError message={fieldErrors.anchorDate} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="reminder-days" className="text-xs text-muted">Reminder Days Before</Label>
              <Input
                id="reminder-days"
                type="number"
                min={0}
                max={30}
                value={formState.reminderDaysBefore ?? 3}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    reminderDaysBefore: Number(event.target.value),
                  }))
                }
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.reminderDaysBefore} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as RecurringBill["status"] }))
                }
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurringBillStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {recurringBillStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.status} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.autopay}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({ ...current, autopay: checked === true }))
                }
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Autopay enabled</p>
                <p className="pt-1 text-sm text-muted">
                  Keep the bill on the calendar, but visually distinguish items that should already pay themselves.
                </p>
              </div>
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bill-notes" className="text-xs text-muted">Notes</Label>
            <Textarea
              id="bill-notes"
              value={formState.notes ?? ""}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional notes about where this bill is paid from or how to reconcile it."
              className={textareaClassName}
            />
            <FieldError message={fieldErrors.notes} />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
