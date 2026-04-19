"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Coins, LayoutGrid, RefreshCcw, WalletCards } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPreferences } from "@/features/preferences/hooks/useUserPreferences";
import type { UserPreferences } from "@/features/preferences/types/UserPreferences";
import { ApiValidationError } from "@/lib/api-errors";

const currencyOptions: Array<{
  value: UserPreferences["primaryCurrencyCode"];
  label: string;
  note: string;
}> = [
  {
    value: "PHP",
    label: "Philippine Peso (PHP)",
    note: "Best when most of your ledgers, bills, and budgets are anchored in local peso spending.",
  },
  {
    value: "USD",
    label: "US Dollar (USD)",
    note: "Useful when cross-border accounts or dollar-denominated goals drive your high-level planning.",
  },
];

const affectedSurfaces = [
  {
    icon: WalletCards,
    title: "Accounts Summary",
    description: "Net worth, total assets, and liabilities convert into your chosen headline currency.",
  },
  {
    icon: BellRing,
    title: "Bills Rollups",
    description: "Scheduled bill totals use this currency while each bill keeps its native denomination.",
  },
  {
    icon: Coins,
    title: "Savings Goals",
    description: "Goal summary totals and funded progress rollups adopt the same primary currency.",
  },
  {
    icon: LayoutGrid,
    title: "Dashboard Modules",
    description: "High-level account-ledger cards on the dashboard stay consistent across mixed-currency records.",
  },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PreferencesView() {
  const { preferences, error, isPending, reloadPreferences, updatePreferences } = useUserPreferences();
  const [draftCurrencyCode, setDraftCurrencyCode] = useState<UserPreferences["primaryCurrencyCode"]>("PHP");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!preferences) {
      return;
    }

    setDraftCurrencyCode(preferences.primaryCurrencyCode);
  }, [preferences]);

  const selectedCurrency = useMemo(
    () => currencyOptions.find((option) => option.value === draftCurrencyCode) ?? currencyOptions[0],
    [draftCurrencyCode]
  );

  const isDirty = preferences ? draftCurrencyCode !== preferences.primaryCurrencyCode : false;

  const handleSave = async () => {
    if (!preferences || !isDirty) {
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      setFormError(null);
      setStatusMessage(null);

      const updatedPreferences = await updatePreferences({
        primaryCurrencyCode: draftCurrencyCode,
      });

      setDraftCurrencyCode(updatedPreferences.primaryCurrencyCode);
      setStatusMessage(`Primary currency saved as ${updatedPreferences.primaryCurrencyCode}.`);
    } catch (saveError) {
      if (saveError instanceof ApiValidationError) {
        setFieldErrors(saveError.fieldErrors ?? {});
        setFormError(saveError.formErrors?.[0] ?? saveError.message);
      } else {
        setFormError(saveError instanceof Error ? saveError.message : "Failed to update primary currency.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Settings"
        title="Make every rollup speak the same currency"
        description="Choose the headline currency used for account, bill, goal, and dashboard summaries while preserving each record's original denomination."
        action={
          <Badge variant={preferences ? "success" : "info"} className="self-start md:self-auto">
            {preferences ? `${preferences.primaryCurrencyCode} active` : "Loading"}
          </Badge>
        }
      />

      {preferences === null && isPending ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[320px] w-full rounded-3xl" />
          <Skeleton className="h-[320px] w-full rounded-3xl" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[28px] border-secondary/20 bg-surface-raised">
            <CardContent className="relative p-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(84,193,255,0.16),transparent_34%),linear-gradient(135deg,rgba(28,38,56,0.9),rgba(9,15,24,0.96))]" />
              <div className="relative space-y-6 p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <Badge variant="info">Primary Currency</Badge>
                    <div className="space-y-2">
                      <h2 className="max-w-xl text-2xl font-semibold tracking-tightest text-foreground md:text-3xl">
                        Pick the currency that should anchor every cross-feature summary.
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-muted">
                        VaultIQ keeps raw accounts, bills, goals, and budgets in their native currencies. This setting only changes how totals
                        and planning rollups are translated when the app needs one clean headline number.
                      </p>
                    </div>
                  </div>

                  <div className="min-w-[10rem] rounded-2xl border border-secondary/20 bg-background/30 px-4 py-3 backdrop-blur">
                    <p className="text-2xs uppercase tracking-[0.28em] text-muted">Current Base</p>
                    <p className="financial-figure pt-2 text-3xl font-semibold text-secondary">{selectedCurrency.value}</p>
                    <p className="pt-1 text-xs text-muted">{selectedCurrency.label}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {affectedSurfaces.map((surface) => (
                    <div key={surface.title} className="rounded-2xl border border-white/8 bg-background/20 p-4 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-secondary">
                          <surface.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{surface.title}</p>
                          <p className="text-sm leading-6 text-muted">{surface.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <Badge variant="default">Record amounts remain native</Badge>
                  <Badge variant="default">Aggregates convert at summary time</Badge>
                  {preferences ? <span>Last synced to your profile {formatTimestamp(preferences.updatedAt)}.</span> : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-surface">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Display Preference</CardTitle>
                  <CardDescription className="pt-2 leading-6">
                    Change the primary currency used for portfolio-level summaries without editing the currency on any underlying record.
                  </CardDescription>
                </div>
                <Badge variant={isDirty ? "warning" : "success"}>{isDirty ? "Unsaved" : "Saved"}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary-currency" className="text-xs uppercase tracking-[0.24em] text-muted">
                  Primary Currency
                </Label>
                <Select
                  value={draftCurrencyCode}
                  onValueChange={(value) => {
                    setDraftCurrencyCode(value as UserPreferences["primaryCurrencyCode"]);
                    setFieldErrors({});
                    setFormError(null);
                    setStatusMessage(null);
                  }}
                >
                  <SelectTrigger
                    id="primary-currency"
                    className="h-12 rounded-2xl border-border bg-background/40 text-sm text-foreground focus:ring-secondary"
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-surface text-foreground">
                    {currencyOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="rounded-xl focus:bg-accent-muted focus:text-foreground"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.primaryCurrencyCode?.[0]} />
                <p className="text-sm leading-6 text-muted">{selectedCurrency.note}</p>
              </div>

              <div className="rounded-2xl border border-border bg-background/25 p-4">
                <p className="text-2xs uppercase tracking-[0.24em] text-muted">What happens when you save</p>
                <ul className="space-y-2 pt-3 text-sm leading-6 text-foreground">
                  <li>Dashboard and account summaries switch to {selectedCurrency.value}.</li>
                  <li>Goal and bill rollups use {selectedCurrency.value} for aggregate totals.</li>
                  <li>Individual records still keep their own original currency values.</li>
                </ul>
              </div>

              {error ? (
                <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
                  <p className="font-medium">Preferences could not be loaded.</p>
                  <p className="pt-1">{error}</p>
                </div>
              ) : null}

              {formError ? (
                <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
                  {formError}
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
                  {statusMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!preferences || !isDirty || isSaving}
                  className="h-11 rounded-xl bg-secondary px-5 text-background hover:bg-secondary/85"
                >
                  {isSaving ? "Saving..." : "Save Primary Currency"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    reloadPreferences();
                    setFieldErrors({});
                    setFormError(null);
                    setStatusMessage(null);
                  }}
                  className="h-11 rounded-xl border border-border bg-background/40 px-4 text-foreground hover:bg-background/70"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
