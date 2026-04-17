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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type BudgetModalProps = {
  budget?: Budget;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
};

const initialFormState: CreateBudgetFormInput = {
  category: "",
  period: "monthly",
  limitAmount: "",
  spentAmount: "",
  currencyCode: "PHP",
  startsAt: "",
  endsAt: "",
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
    spentAmount: budget.spentAmount.toFixed(2),
    currencyCode: budget.currencyCode,
    startsAt: budget.startsAt,
    endsAt: budget.endsAt,
    notes: budget.notes ?? "",
  };
}

export function BudgetModal({ budget, onSubmit }: BudgetModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateBudgetFormInput>(toFormState(budget));

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
      <DialogContent className="max-h-[70dvh] min-h-[10dvh] w-full overflow-y-auto sm:max-h-[60vh] sm:min-h-[20vh] p-4 sm:p-8 rounded-xl">
        <DialogHeader>
          <DialogTitle>{budget ? "Update Budget" : "Create Budget"}</DialogTitle>
          <DialogDescription>
            {budget
              ? "Update the details for this budget."
              : "Fill out the form below to add a new budget."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border/20 bg-muted/10 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground">Budget Setup</h4>
              <p className="text-xs text-muted-foreground">Configure your spending limits and tracking period</p>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Food, Housing, Utilities"
                />
                <FieldError message={fieldErrors.category} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formState.period}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      period: value as CreateBudgetInput["period"],
                    }))
                  }
                >
                  <SelectTrigger id="period">
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
          </div>

          <div className="rounded-lg border border-border/20 bg-muted/10 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground">Financial Details</h4>
              <p className="text-xs text-muted-foreground">Set your currency and spending limits</p>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="currencyCode">Currency</Label>
                <Select
                  value={formState.currencyCode}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      currencyCode: value,
                    }))
                  }
                >
                  <SelectTrigger id="currencyCode" className="min-h-10">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.currencyCode} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="limitAmount">Limit Amount</Label>
                <CurrencyInput
                  id="limitAmount"
                  value={formState.limitAmount}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      limitAmount: event.target.value,
                    }))
                  }
                  currencyCode={formState.currencyCode}
                />
                <FieldError message={fieldErrors.limitAmount} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spentAmount">Spent Amount</Label>
                <CurrencyInput
                  id="spentAmount"
                  value={formState.spentAmount ?? ""}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      spentAmount: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  currencyCode={formState.currencyCode}
                />
                <FieldError message={fieldErrors.spentAmount} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/20 bg-muted/10 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground">Duration Settings</h4>
              <p className="text-xs text-muted-foreground">Define when your budget period starts and ends</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <DatePicker
                  value={formState.startsAt}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, startsAt: value }))
                  }
                  placeholder="Select start date"
                />
                <FieldError message={fieldErrors.startsAt} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">End Date</Label>
                <DatePicker
                  value={formState.endsAt}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, endsAt: value }))
                  }
                  placeholder="Select end date"
                />
                <FieldError message={fieldErrors.endsAt} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formState.notes ?? ""}
              onChange={(event) =>
                setFormState((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Optional operating note for this budget."
            />
            <FieldError message={fieldErrors.notes} />
          </div>

          <FieldError message={error} className="text-sm" />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : budget ? "Update Budget" : "Save Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
