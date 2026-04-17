"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { z } from "zod";

import { budgetPeriods } from "@/features/budgets/constants/budget.constants";
import { createBudgetFormSchema } from "@/features/budgets/schemas/budget.schema";
import type { CreateBudgetFormInput, CreateBudgetInput } from "@/features/budgets/types/Budget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type BudgetModalProps = {
  onCreate: (input: CreateBudgetInput) => Promise<void>;
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

export function BudgetModal({ onCreate }: BudgetModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateBudgetFormInput>(initialFormState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = createBudgetFormSchema.parse(formState);
      await onCreate(payload);
      setFormState(initialFormState);
      setOpen(false);
    } catch (submitError) {
      if (submitError instanceof z.ZodError) {
        const firstIssue = submitError.issues[0];
        setError(firstIssue?.message ?? "Invalid budget payload.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Unable to create budget.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Validate the budget locally with Zod before it reaches the API or future RPC layer.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <Input
                id="currencyCode"
                maxLength={3}
                value={formState.currencyCode}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    currencyCode: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="PHP"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="limitAmount">Limit Amount</Label>
              <Input
                id="limitAmount"
                type="number"
                min="0"
                step="0.01"
                value={formState.limitAmount}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    limitAmount: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spentAmount">Spent Amount</Label>
              <Input
                id="spentAmount"
                type="number"
                min="0"
                step="0.01"
                value={formState.spentAmount ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    spentAmount: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Start Date</Label>
              <Input
                id="startsAt"
                type="date"
                value={formState.startsAt}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsAt">End Date</Label>
              <Input
                id="endsAt"
                type="date"
                value={formState.endsAt}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
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
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
