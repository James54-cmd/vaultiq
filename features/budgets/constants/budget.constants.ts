export const budgetPeriods = ["weekly", "monthly", "yearly"] as const;

export const budgetStatuses = ["active", "archived"] as const;

export const budgetSeed = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    category: "Housing",
    period: "monthly",
    limitAmount: 60000,
    spentAmount: 42250.5,
    currencyCode: "PHP",
    startsAt: "2026-04-01",
    endsAt: "2026-04-30",
    status: "active",
    notes: "Condo dues, maintenance, and shared utilities.",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    category: "Food",
    period: "monthly",
    limitAmount: 24000,
    spentAmount: 18820.15,
    currencyCode: "PHP",
    startsAt: "2026-04-01",
    endsAt: "2026-04-30",
    status: "active",
    notes: "Groceries plus dining.",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    category: "Transport",
    period: "monthly",
    limitAmount: 15000,
    spentAmount: 12640.3,
    currencyCode: "PHP",
    startsAt: "2026-04-01",
    endsAt: "2026-04-30",
    status: "active",
    notes: "Fuel, ride-share, and tolls.",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
  },
] as const;
