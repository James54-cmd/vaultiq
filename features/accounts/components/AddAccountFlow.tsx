"use client";

import { useState, type FormEvent } from "react";
import { Plus, ArrowLeft, Building2 } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { SUPPORTED_INSTITUTIONS, Institution } from "@/features/accounts/constants/institutions";
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

type AddAccountFlowProps = {
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

export function AddAccountFlow({ onSubmit }: AddAccountFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<CreateFinancialAccountFormInput>(initialFormState);

  const handleSelectInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setFormState({
      ...initialFormState,
      institutionName: institution.name === "Other Institution" ? "" : institution.name,
      accountType: institution.type === "ewallet" ? "ewallet" : institution.type === "credit" ? "credit_card" : "savings",
      kind: institution.type === "credit" ? "liability" : "asset",
    });
    setStep("form");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedInstitution(null);
    setFormState(initialFormState);
    setError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      const payload = createFinancialAccountFormSchema.parse(formState);
      await onSubmit(payload);
      setFormState(initialFormState);
      setStep("select");
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
          setStep("select");
          setSelectedInstitution(null);
          setFormState(initialFormState);
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300">
          <span className="relative z-10 flex items-center">
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Connect Account
          </span>
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-border bg-surface-raised p-0 text-foreground">
        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="border-b border-border px-6 py-5">
                <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground">
                  Select Institution
                </DialogTitle>
                <DialogDescription className="pt-2 text-sm text-muted">
                  Choose a bank or wallet to set up your manual ledger.
                </DialogDescription>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SUPPORTED_INSTITUTIONS.map((inst, index) => (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      key={inst.id}
                      onClick={() => handleSelectInstitution(inst)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-transparent overflow-hidden"
                      )}
                    >
                      <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10 bg-gradient-to-br", inst.gradient)} />

                      <div className={cn(
                        "flex h-14 w-20 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110",
                        inst.logo ? "bg-white border border-border" : cn("bg-gradient-to-br", inst.gradient)
                      )}>
                        {inst.logo ? (
                          <Image
                            src={inst.logo}
                            alt={inst.name}
                            width={80}
                            height={56}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : inst.type === 'other' ? (
                          <Building2 className="h-6 w-6 text-white" />
                        ) : (
                          <span className="font-bold text-white tracking-tight">{inst.logoText}</span>
                        )}
                      </div>
                      <span className="font-medium text-foreground relative z-10">{inst.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="border-b border-border px-6 py-5 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 rounded-full h-8 w-8 hover:bg-surface">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tightest text-foreground flex items-center gap-2">
                    {selectedInstitution?.name === "Other Institution" ? "Add Account" : `Connect ${selectedInstitution?.name}`}
                  </DialogTitle>
                  <DialogDescription className="pt-1 text-sm text-muted">
                    Enter the starting balance for your ledger.
                  </DialogDescription>
                </div>
              </div>

              <form className="flex flex-col max-h-[70vh] overflow-hidden" onSubmit={handleSubmit}>
                <div className="space-y-5 px-6 py-5 overflow-y-auto flex-1">
                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="account-name" className="text-xs text-muted">Account Name</Label>
                    <Input
                      id="account-name"
                      value={formState.name}
                      onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                      placeholder={selectedInstitution?.name === "Other Institution" ? "Emergency Fund" : `${selectedInstitution?.name} Savings`}
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
                      placeholder="e.g. UnionBank"
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
                </div>

                <div className="shrink-0 bg-surface-raised px-6 py-4 border-t border-border flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isSubmitting ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
