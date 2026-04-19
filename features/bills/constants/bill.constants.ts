export const recurringBillCadences = ["monthly", "quarterly", "yearly"] as const;
export const recurringBillStatuses = ["active", "paused", "archived"] as const;

export const recurringBillCadenceLabels: Record<(typeof recurringBillCadences)[number], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const recurringBillStatusLabels: Record<(typeof recurringBillStatuses)[number], string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};
