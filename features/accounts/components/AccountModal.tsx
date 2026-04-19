"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { z } from "zod";

import {
  financialAccountKindLabels,
  financialAccountKinds,
  financialAccountStatusLabels,
  financialAccountStatuses,
  financialAccountTypeLabels,
  financialAccountTypes,
} from "@/features/accounts/constants/account.constants";
import { createFinancialAccountFormSchema } from "@/features/accounts/schemas/account.schema";
import type {
  CreateFinancialAccountFormInput,
  CreateFinancialAccountInput,
  FinancialAccount,
} from "@/features/accounts/types/FinancialAccount";
import { ApiValidationError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedCurrencyCodes } from "@/lib/currency";
import { cn } from "@/lib/utils";

type AccountModalProps = {
  account?: FinancialAccount;
  initialValues?: Partial<CreateFinancialAccountFormInput>;
  onSubmit: (input: CreateFinancialAccountInput) => Promise<void>;
};

const accountFieldClassName =
  "h-10 rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";
const accountTextareaClassName =
  "min-h-[120px] rounded-md border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary";

const initialFormState: CreateFinancialAccountFormInput = {
  name: "",
  institutionName: "",
  accountType: "savings",
  kind: "asset",
  source: "manual",
  currencyCode: "PHP",
  currentBalance: "",
  creditLimit: "",
  includeInNetWorth: true,
  status: "active",
  notes: "",
};

function toFormState(account?: FinancialAccount, initialValues?: Partial<CreateFinancialAccountFormInput>): CreateFinancialAccountFormInput {
  if (!account) {
    return { ...initialFormState, ...initialValues };
  }

  return {
    name: account.name,
    institutionName: account.institutionName,
    accountType: account.accountType,
    kind: account.kind,
    source: account.source,
    currencyCode: account.currencyCode,
    currentBalance: account.currentBalance.toFixed(2),
    creditLimit: account.creditLimit === null ? "" : account.creditLimit.toFixed(2),
    includeInNetWorth: account.includeInNetWorth,
    status: account.status,
    notes: account.notes ?? "",
  };
}

export function AccountModal({ account, initialValues, onSubmit }: AccountModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateFinancialAccountFormInput>(toFormState(account, initialValues));
  const isEditMode = Boolean(account);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      const payload = createFinancialAccountFormSchema.parse(formState);
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
        setError(submitError instanceof Error ? submitError.message : "Unable to save account.");
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
          setFormState(toFormState(account, initialValues));
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        {account ? (
          <Button variant="secondary" size="icon" aria-label="Edit account">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl border-border bg-surface-raised p-0 text-foreground">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
            {isEditMode ? "Edit Account" : "Add Account"}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted">
            Track manual and synced-style assets or liabilities in one net-worth model.
          </DialogDescription>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="account-name" className="text-xs text-muted">Account Name</Label>
              <Input
                id="account-name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Emergency Fund, Visa Card, Condo Equity"
                className={accountFieldClassName}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="institution-name" className="text-xs text-muted">Institution</Label>
              <Input
                id="institution-name"
                value={formState.institutionName}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, institutionName: event.target.value }))
                }
                placeholder="BPI, UnionBank, Manual"
                className={accountFieldClassName}
              />
              <FieldError message={fieldErrors.institutionName} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Type</Label>
              <Select
                value={formState.accountType}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, accountType: value as FinancialAccount["accountType"] }))
                }
              >
                <SelectTrigger className={accountFieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {financialAccountTypes.map((accountType) => (
                    <SelectItem key={accountType} value={accountType}>
                      {financialAccountTypeLabels[accountType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.accountType} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Kind</Label>
              <Select
                value={formState.kind}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, kind: value as FinancialAccount["kind"] }))
                }
              >
                <SelectTrigger className={accountFieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {financialAccountKinds.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {financialAccountKindLabels[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.kind} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, status: value as FinancialAccount["status"] }))
                }
              >
                <SelectTrigger className={accountFieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {financialAccountStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {financialAccountStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.status} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted">Currency</Label>
              <Select
                value={formState.currencyCode}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, currencyCode: value as FinancialAccount["currencyCode"] }))
                }
              >
                <SelectTrigger className={accountFieldClassName}>
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
              <Label htmlFor="current-balance" className="text-xs text-muted">Current Balance</Label>
              <CurrencyInput
                id="current-balance"
                value={formState.currentBalance}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, currentBalance: event.target.value }))
                }
                className={accountFieldClassName}
              />
              <FieldError message={fieldErrors.currentBalance} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="credit-limit" className="text-xs text-muted">Credit Limit</Label>
              <CurrencyInput
                id="credit-limit"
                value={formState.creditLimit ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, creditLimit: event.target.value }))
                }
                className={accountFieldClassName}
              />
              <FieldError message={fieldErrors.creditLimit} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={formState.includeInNetWorth}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({
                    ...current,
                    includeInNetWorth: checked === true,
                  }))
                }
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Include in net worth</p>
                <p className="pt-1 text-sm text-muted">
                  Turn this off for operational accounts you want visible but excluded from the headline summary.
                </p>
              </div>
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="account-notes" className="text-xs text-muted">Notes</Label>
            <Textarea
              id="account-notes"
              value={formState.notes ?? ""}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional notes about this account."
              className={cn(accountTextareaClassName)}
            />
            <FieldError message={fieldErrors.notes} />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
