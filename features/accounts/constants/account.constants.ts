export const financialAccountKinds = ["asset", "liability"] as const;
export const financialAccountSources = ["manual", "synced"] as const;
export const financialAccountStatuses = ["active", "syncing", "error", "archived"] as const;
export const financialAccountTypes = [
  "cash",
  "checking",
  "savings",
  "credit_card",
  "ewallet",
  "investment",
  "loan",
  "property",
  "other",
] as const;

export const financialAccountTypeLabels: Record<(typeof financialAccountTypes)[number], string> = {
  cash: "Cash",
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  ewallet: "E-Wallet",
  investment: "Investment",
  loan: "Loan",
  property: "Property",
  other: "Other",
};

export const financialAccountStatusLabels: Record<(typeof financialAccountStatuses)[number], string> = {
  active: "Active",
  syncing: "Syncing",
  error: "Error",
  archived: "Archived",
};

export const financialAccountKindLabels: Record<(typeof financialAccountKinds)[number], string> = {
  asset: "Asset",
  liability: "Liability",
};
