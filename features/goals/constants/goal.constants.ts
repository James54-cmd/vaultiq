export const savingsGoalStatuses = ["active", "archived"] as const;

export const savingsGoalStatusLabels: Record<(typeof savingsGoalStatuses)[number], string> = {
  active: "Active",
  archived: "Archived",
};
