"use client";

import { useEffect, useMemo, useState } from "react";

import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  TransactionDialogBody,
  TransactionDialogFooterBar,
  TransactionDialogHeaderFrame,
  TransactionDialogHeading,
  TransactionDialogMetaList,
  TransactionDialogSection,
  transactionDialogContentClassName,
} from "@/features/transactions/components/TransactionDialogScaffold";
import { createTransactionFormSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  transactionCategories,
  transactionStatuses,
  transactionTypes,
} from "@/features/transactions/constants/transaction.constants";
import { formatTransactionLabel } from "@/features/transactions/utils/formatTransactionLabel";
import type {
  CreateTransactionFormInput,
  CreateTransactionInput,
  Transaction,
} from "@/features/transactions/types/Transaction";
import type { FinancialAccount } from "@/features/accounts/types/FinancialAccount";
import { ApiValidationError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

type QuickAddTransactionModalProps = {
  triggerLabel?: string;
  accounts?: FinancialAccount[];
  transaction?: Transaction | null;
  open?: boolean;
  mode?: "create" | "edit";
  onOpenChange?: (open: boolean) => void;
  onSubmit: (input: CreateTransactionInput | CreateTransactionFormInput) => Promise<void>;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const emptyValues: CreateTransactionFormInput = {
  source: "manual",
  type: "expense",
  amount: "",
  currencyCode: "PHP",
  accountId: "none",
  fromAccountId: "none",
  toAccountId: "none",
  originalTransactionId: "none",
  merchantName: "",
  merchant: "",
  description: "",
  category: "uncategorized",
  referenceNumber: "",
  notes: "",
  status: "confirmed",
  transactionDate: todayInputValue(),
};

function getAccountLabel(account: FinancialAccount) {
  return `${account.name} - ${account.institutionName}`;
}

function getInitialValues(transaction?: Transaction | null): CreateTransactionFormInput {
  if (!transaction) {
    return {
      ...emptyValues,
      transactionDate: todayInputValue(),
    };
  }

  return {
    source: transaction.source,
    type: transaction.type,
    amount: String(transaction.amount),
    currencyCode: transaction.currencyCode,
    accountId: transaction.accountId ?? "none",
    fromAccountId: transaction.fromAccountId ?? "none",
    toAccountId: transaction.toAccountId ?? "none",
    originalTransactionId: transaction.originalTransactionId ?? "none",
    merchantName: transaction.merchantName,
    merchant: transaction.merchantName,
    description: transaction.description,
    category: transaction.category,
    referenceNumber: transaction.referenceNumber ?? "",
    notes: transaction.notes ?? "",
    status: transaction.status,
    transactionDate: transaction.transactionDate.slice(0, 10),
  };
}

export function QuickAddTransactionModal({
  triggerLabel = "Quick Add",
  accounts = [],
  transaction = null,
  open,
  mode = transaction ? "edit" : "create",
  onOpenChange,
  onSubmit,
}: QuickAddTransactionModalProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status !== "archived"),
    [accounts]
  );
  const [values, setValues] = useState<CreateTransactionFormInput>(() => getInitialValues(transaction));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isTransfer = values.type === "transfer";
  const isAdjustment = values.type === "adjustment";

  useEffect(() => {
    if (!isOpen) {
      setValues(getInitialValues(mode === "edit" ? transaction : null));
      setFieldErrors({});
      setFormError(null);
      setIsPending(false);
      return;
    }

    setValues(getInitialValues(transaction));
    setFieldErrors({});
    setFormError(null);
    setIsPending(false);
  }, [isOpen, mode, transaction]);

  const updateValue = <Key extends keyof CreateTransactionFormInput>(
    key: Key,
    value: CreateTransactionFormInput[Key]
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const accountSelector = (
    id: "accountId" | "fromAccountId" | "toAccountId",
    label: string,
    error?: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`transaction-${id}`} className="text-xs text-muted">{label}</Label>
      <Select
        value={(values[id] as string | null | undefined) ?? "none"}
        onValueChange={(value) => updateValue(id, value)}
      >
        <SelectTrigger id={`transaction-${id}`} className="h-9 text-sm">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select account</SelectItem>
          {activeAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {getAccountLabel(account)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button>{triggerLabel}</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className={cn(transactionDialogContentClassName, "bg-surface-raised")}>
        <TransactionDialogHeaderFrame className="pr-10">
          <TransactionDialogHeading
            title={
              <DialogTitle className="pr-6 text-base font-semibold text-foreground sm:text-lg">
                {mode === "edit" ? "Edit Transaction" : "New Transaction"}
              </DialogTitle>
            }
            description={
              <DialogDescription className="text-sm leading-5 text-muted">
                {mode === "edit"
                  ? "Update the lifecycle fields that determine reporting and account balance effects."
                  : "Add a transaction manually with clear type, status, source, and account links."}
              </DialogDescription>
            }
          />
          <TransactionDialogMetaList
            className="sm:grid-cols-3"
            items={[
              { label: "Type", value: formatTransactionLabel(values.type) },
              { label: "Status", value: formatTransactionLabel(String(values.status ?? "confirmed")) },
              { label: "Source", value: formatTransactionLabel(String(values.source ?? "manual")) },
            ]}
          />
        </TransactionDialogHeaderFrame>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsPending(true);
            setFieldErrors({});
            setFormError(null);

            const parsed = createTransactionFormSchema.safeParse(values);
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
          <TransactionDialogBody>
            <div className="space-y-6">
              <TransactionDialogSection
                title="Lifecycle"
                description="Set the transaction type, status, amount, date, and affected account."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-type" className="text-xs text-muted">Type</Label>
                    <Select
                      value={values.type}
                      onValueChange={(value) =>
                        setValues((current) => ({
                          ...current,
                          type: value as CreateTransactionFormInput["type"],
                          accountId: value === "transfer" ? current.fromAccountId : current.accountId,
                        }))
                      }
                    >
                      <SelectTrigger id="transaction-type" className="h-9 text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatTransactionLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldErrors.type?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-amount" className="text-xs text-muted">Amount</Label>
                    <CurrencyInput
                      id="transaction-amount"
                      value={values.amount}
                      min={isAdjustment ? undefined : "0"}
                      currencyCode={values.currencyCode}
                      onChange={(event) => updateValue("amount", event.target.value)}
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.amount?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-date" className="text-xs text-muted">Transaction Date</Label>
                    <DatePicker
                      value={values.transactionDate}
                      onChange={(value) => updateValue("transactionDate", value)}
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.transactionDate?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-status" className="text-xs text-muted">Status</Label>
                    <Select
                      value={String(values.status ?? "confirmed")}
                      onValueChange={(value) =>
                        updateValue("status", value as CreateTransactionFormInput["status"])
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

                <div className="grid gap-3 sm:grid-cols-2">
                  {isTransfer ? (
                    <>
                      {accountSelector("fromAccountId", "From Account", fieldErrors.fromAccountId?.[0])}
                      {accountSelector("toAccountId", "To Account", fieldErrors.toAccountId?.[0])}
                    </>
                  ) : (
                    accountSelector("accountId", "Account", fieldErrors.accountId?.[0])
                  )}
                </div>
              </TransactionDialogSection>

              <TransactionDialogSection
                title="Details"
                description="Keep labels concise so lists, dashboards, and imports stay easy to reconcile."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-merchant" className="text-xs text-muted">Merchant / Title</Label>
                    <Input
                      id="transaction-merchant"
                      value={values.merchantName}
                      onChange={(event) => {
                        updateValue("merchantName", event.target.value);
                        updateValue("merchant", event.target.value);
                      }}
                      placeholder="Meralco, Salary, Cash Correction"
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.merchantName?.[0] ?? fieldErrors.merchant?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-category" className="text-xs text-muted">Category</Label>
                    <Select
                      value={values.category}
                      onValueChange={(value) =>
                        updateValue("category", value as CreateTransactionFormInput["category"])
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
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-description" className="text-xs text-muted">Description</Label>
                    <Input
                      id="transaction-description"
                      value={values.description ?? ""}
                      onChange={(event) => updateValue("description", event.target.value)}
                      placeholder="Optional ledger summary"
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.description?.[0]} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="transaction-reference" className="text-xs text-muted">Reference Number</Label>
                    <Input
                      id="transaction-reference"
                      value={values.referenceNumber ?? ""}
                      onChange={(event) => updateValue("referenceNumber", event.target.value)}
                      placeholder="Optional"
                      className="h-9 text-sm"
                    />
                    <FieldError message={fieldErrors.referenceNumber?.[0]} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transaction-notes" className="text-xs text-muted">
                    Notes{isAdjustment ? " (required for adjustments)" : ""}
                  </Label>
                  <Textarea
                    id="transaction-notes"
                    value={values.notes ?? ""}
                    onChange={(event) => updateValue("notes", event.target.value)}
                    placeholder={isAdjustment ? "Reason for the balance correction" : "Optional context for future reconciliation"}
                    rows={3}
                    className="w-full resize-none text-sm"
                  />
                  <FieldError message={fieldErrors.notes?.[0]} />
                </div>
              </TransactionDialogSection>
            </div>
          </TransactionDialogBody>

          <TransactionDialogFooterBar className="bg-surface-raised/95">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {formError ? <FieldError message={formError} /> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                  {isPending ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Transaction"}
                </Button>
              </div>
            </div>
          </TransactionDialogFooterBar>
        </form>
      </DialogContent>
    </Dialog>
  );
}
