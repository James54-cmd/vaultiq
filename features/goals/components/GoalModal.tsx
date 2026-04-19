"use client";

import { useState, type FormEvent } from "react";
import { Goal, Pencil, Plus } from "lucide-react";
import { z } from "zod";

import { createSavingsGoalFormSchema } from "@/features/goals/schemas/goal.schema";
import type {
  CreateSavingsGoalFormInput,
  CreateSavingsGoalInput,
  SavingsGoal,
} from "@/features/goals/types/Goal";
import { savingsGoalStatusLabels, savingsGoalStatuses } from "@/features/goals/constants/goal.constants";
import { ApiValidationError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedCurrencyCodes } from "@/lib/currency";

type GoalModalProps = {
  goal?: SavingsGoal;
  onSubmit: (input: CreateSavingsGoalInput) => Promise<void>;
};

const fieldClassName =
  "h-10 rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";
const textareaClassName =
  "min-h-[120px] rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";

const initialFormState: CreateSavingsGoalFormInput = {
  name: "",
  targetAmount: "",
  savedAmount: "",
  currencyCode: "PHP",
  targetDate: "",
  status: "active",
  notes: "",
};

function toFormState(goal?: SavingsGoal): CreateSavingsGoalFormInput {
  if (!goal) {
    return initialFormState;
  }

  return {
    name: goal.name,
    targetAmount: goal.targetAmount.toFixed(2),
    savedAmount: goal.savedAmount.toFixed(2),
    currencyCode: goal.currencyCode,
    targetDate: goal.targetDate ?? "",
    status: goal.status,
    notes: goal.notes ?? "",
  };
}

export function GoalModal({ goal, onSubmit }: GoalModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateSavingsGoalFormInput>(toFormState(goal));
  const isEditMode = Boolean(goal);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      const payload = createSavingsGoalFormSchema.parse(formState);
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
        setError(submitError instanceof Error ? submitError.message : "Unable to save goal.");
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
          setFormState(toFormState(goal));
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        {goal ? (
          <Button variant="secondary" size="icon" aria-label="Edit goal">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl border-border bg-surface-raised p-0 text-foreground">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
            {isEditMode ? "Edit Goal" : "Create Goal"}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted">
            Keep long-range financial targets visible with current saved progress and an optional target date.
          </DialogDescription>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="goal-name" className="text-xs text-muted">Goal Name</Label>
              <Input
                id="goal-name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Emergency Fund, Vacation, Home Downpayment"
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.name} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Currency</Label>
              <Select
                value={formState.currencyCode}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, currencyCode: value as SavingsGoal["currencyCode"] }))
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
              <Label htmlFor="target-amount" className="text-xs text-muted">Target Amount</Label>
              <CurrencyInput
                id="target-amount"
                value={formState.targetAmount}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, targetAmount: event.target.value }))
                }
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.targetAmount} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="saved-amount" className="text-xs text-muted">Saved Amount</Label>
              <CurrencyInput
                id="saved-amount"
                value={formState.savedAmount ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, savedAmount: event.target.value }))
                }
                className={fieldClassName}
              />
              <FieldError message={fieldErrors.savedAmount} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as SavingsGoal["status"] }))
                }
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {savingsGoalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {savingsGoalStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.status} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Target Date</Label>
              <DatePicker
                value={formState.targetDate}
                onChange={(value) => setFormState((current) => ({ ...current, targetDate: value }))}
                placeholder="Set a target date"
              />
              <FieldError message={fieldErrors.targetDate} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="goal-notes" className="text-xs text-muted">Notes</Label>
            <Textarea
              id="goal-notes"
              value={formState.notes ?? ""}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional notes about why this goal matters or how you plan to fund it."
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
              {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
