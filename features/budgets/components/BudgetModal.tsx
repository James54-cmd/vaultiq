"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { z } from "zod";

import { budgetPeriods } from "@/features/budgets/constants/budget.constants";
import { currencyOptions } from "@/features/budgets/constants/currency.constants";
import { createBudgetFormSchema } from "@/features/budgets/schemas/budget.schema";
import type { Budget, CreateBudgetFormInput, CreateBudgetInput } from "@/features/budgets/types/Budget";
import { formatBudgetLabel } from "@/features/budgets/utils/formatBudgetLabel";
import { ApiValidationError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DialogShellBody,
  dialogShellContentClassName,
  DialogShellFooterBar,
  DialogShellHeaderFrame,
  DialogShellHeading,
  DialogShellMetaList,
  DialogShellSection,
} from "@/components/ui/dialog-shell";
import { FieldError } from "@/components/ui/field-error";
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
import { formatDatePickerLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

type BudgetModalProps = {
  budget?: Budget;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
};

const initialFormState: CreateBudgetFormInput = {
  category: "",
  period: "monthly",
  limitAmount: "",
  currencyCode: "PHP",
  startsAt: "",
  endsAt: "",
  alertThresholdPercent: "80",
  notes: "",
};

function toFormState(budget?: Budget): CreateBudgetFormInput {
  if (!budget) {
    return initialFormState;
  }

  return {
    category: budget.category,
    period: budget.period,
    limitAmount: budget.limitAmount.toFixed(2),
    currencyCode: budget.currencyCode,
    startsAt: budget.startsAt,
    endsAt: budget.endsAt,
    alertThresholdPercent: budget.alertThresholdPercent.toFixed(2),
    notes: budget.notes ?? "",
  };
}

function formatBudgetWindow(startsAt: string, endsAt: string) {
  if (!startsAt && !endsAt) {
    return "Choose dates";
  }

  if (!startsAt) {
    return `Until ${formatDatePickerLabel(endsAt)}`;
  }

  if (!endsAt) {
    return `Starts ${formatDatePickerLabel(startsAt)}`;
  }

  return `${formatDatePickerLabel(startsAt)} - ${formatDatePickerLabel(endsAt)}`;
}

const budgetFieldClassName =
  "h-10 rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";

const budgetTextareaClassName =
  "min-h-[120px] rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";

export function BudgetModal({ budget, onSubmit }: BudgetModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateBudgetFormInput>(toFormState(budget));
  const isEditMode = Boolean(budget);
  const periodLabel = formatBudgetLabel(formState.period);
  const currencyLabel =
    formState.currencyCode && formState.currencyCode.trim().length > 0 ? formState.currencyCode : "PHP";
  const budgetWindowLabel = formatBudgetWindow(formState.startsAt, formState.endsAt);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      const payload = createBudgetFormSchema.parse(formState);
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
        setError(submitError instanceof Error ? submitError.message : "Unable to create budget.");
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
          setFormState(toFormState(budget));
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        {budget ? (
          <Button variant="secondary" size="icon" aria-label="Edit Budget">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(dialogShellContentClassName, "max-w-xl bg-surface-raised")}>
        <DialogShellHeaderFrame className="pr-10">
          <DialogShellHeading
            title={
              <DialogTitle className="pr-6 text-base font-semibold text-foreground sm:text-lg">
                {isEditMode ? "Edit Budget" : "Create Budget"}
              </DialogTitle>
            }
            description={
              <DialogDescription className="text-sm leading-5 text-muted">
                {isEditMode
                  ? "Adjust the cadence, cap, and warning threshold for this budget."
                  : "Set a category limit with the dates and threshold you want VaultIQ to monitor."}
              </DialogDescription>
            }
          />
          <DialogShellMetaList
            className="sm:grid-cols-3"
            items={[
              { label: "Period", value: periodLabel },
              { label: "Currency", value: currencyLabel },
              {
                label: "Window",
                value: budgetWindowLabel,
                className: "col-span-2 sm:col-span-1",
                valueClassName: "whitespace-normal leading-5",
              },
            ]}
          />
        </DialogShellHeaderFrame>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <DialogShellBody>
            <div className="space-y-5">
              <DialogShellSection
                title="Budget Setup"
                description="Name the category and choose the cadence this budget should track."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="category" className="text-xs text-muted">Category</Label>
                    <Input
                      id="category"
                      value={formState.category}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, category: event.target.value }))
                      }
                      placeholder="Food, Housing, Utilities"
                      className={budgetFieldClassName}
                    />
                    <FieldError message={fieldErrors.category} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="period" className="text-xs text-muted">Period</Label>
                    <Select
                      value={formState.period}
                      onValueChange={(value) =>
                        setFormState((current) => ({
                          ...current,
                          period: value as CreateBudgetInput["period"],
                        }))
                      }
                    >
                      <SelectTrigger id="period" className={budgetFieldClassName}>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetPeriods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {formatBudgetLabel(period)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.period} />
                  </div>
                </div>
              </DialogShellSection>

              <DialogShellSection
                title="Allocation"
                description="Set the currency, cap, and warning threshold that should trigger before you hit the limit."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="currencyCode" className="text-xs text-muted">Currency</Label>
                    <Select
                      value={formState.currencyCode}
                      onValueChange={(value) =>
                        setFormState((current) => ({ ...current, currencyCode: value }))
                      }
                    >
                      <SelectTrigger id="currencyCode" className={budgetFieldClassName}>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((currencyOption) => (
                          <SelectItem key={currencyOption.value} value={currencyOption.value}>
                            {currencyOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.currencyCode} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="limitAmount" className="text-xs text-muted">Limit Amount</Label>
                    <CurrencyInput
                      id="limitAmount"
                      value={formState.limitAmount}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, limitAmount: event.target.value }))
                      }
                      className={budgetFieldClassName}
                    />
                    <FieldError message={fieldErrors.limitAmount} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="alertThresholdPercent" className="text-xs text-muted">Alert Threshold %</Label>
                    <Input
                      id="alertThresholdPercent"
                      inputMode="decimal"
                      value={formState.alertThresholdPercent ?? "80"}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, alertThresholdPercent: event.target.value }))
                      }
                      className={budgetFieldClassName}
                    />
                    <FieldError message={fieldErrors.alertThresholdPercent} />
                  </div>
                </div>
              </DialogShellSection>

              <DialogShellSection
                title="Tracking Window"
                description="Use local calendar dates for the range this budget should watch."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted">Start Date</Label>
                    <DatePicker
                      value={formState.startsAt}
                      onChange={(value) => setFormState((current) => ({ ...current, startsAt: value }))}
                    />
                    <FieldError message={fieldErrors.startsAt} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted">End Date</Label>
                    <DatePicker
                      value={formState.endsAt}
                      onChange={(value) => setFormState((current) => ({ ...current, endsAt: value }))}
                    />
                    <FieldError message={fieldErrors.endsAt} />
                  </div>
                </div>
              </DialogShellSection>

              <DialogShellSection
                title="Notes"
                description="Capture context that explains why the cap exists or when it should be revisited."
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="notes" className="text-xs text-muted">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formState.notes ?? ""}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Optional notes about this budget."
                    className={budgetTextareaClassName}
                  />
                  <FieldError message={fieldErrors.notes} />
                </div>
              </DialogShellSection>
            </div>
          </DialogShellBody>

          <DialogShellFooterBar>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {error ? <p className="mr-auto text-sm text-error">{error}</p> : null}
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Budget"}
              </Button>
            </div>
          </DialogShellFooterBar>
        </form>
      </DialogContent>
    </Dialog>
  );
}
