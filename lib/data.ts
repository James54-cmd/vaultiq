export type AccountStatus = "synced" | "syncing" | "error";
export type TransactionStatus = "completed" | "pending" | "flagged";
export type AccountType =
  | "Savings"
  | "Checking"
  | "Credit"
  | "E-Wallet"
  | "Investment";

export type BankAccount = {
  id: string;
  bank: string;
  initials: string;
  type: AccountType;
  currency: "PHP" | "USD";
  accountNumber: string;
  balance: number;
  availableCredit?: number;
  creditLimit?: number;
  lastSynced: string;
  status: AccountStatus;
  accent: string;
  monthlyChange: number;
};

export type Transaction = {
  id: string;
  date: string;
  bank: string;
  initials: string;
  merchant: string;
  description: string;
  category: string;
  amount: number;
  status: TransactionStatus;
  kind: "Income" | "Expense" | "Transfer" | "Pending";
};

export const bankOptions = [
  "BDO",
  "BPI",
  "UnionBank",
  "Metrobank",
  "Security Bank",
  "Landbank",
  "PNB",
  "EastWest Bank",
  "RCBC",
  "Chinabank",
  "PSBank",
  "AUB",
  "GCash",
  "Maya (PayMaya)",
  "ShopeePay",
  "Coins.ph",
  "Tonik",
  "GoTyme",
  "SeaBank",
  "OwnBank",
  "CIMB",
  "ING Philippines",
  "Wise",
  "Payoneer",
  "Revolut",
];

export const accounts: BankAccount[] = [
  {
    id: "bpi-savings",
    bank: "BPI",
    initials: "BP",
    type: "Savings",
    currency: "PHP",
    accountNumber: "**** **** 1842",
    balance: 842500.42,
    lastSynced: "2 min ago",
    status: "synced",
    accent: "secondary",
    monthlyChange: 4.26,
  },
  {
    id: "bdo-credit",
    bank: "BDO",
    initials: "BD",
    type: "Credit",
    currency: "PHP",
    accountNumber: "**** **** 9031",
    balance: -124320.55,
    availableCredit: 375679.45,
    creditLimit: 500000,
    lastSynced: "6 min ago",
    status: "syncing",
    accent: "warning",
    monthlyChange: -2.91,
  },
  {
    id: "unionbank-checking",
    bank: "UnionBank",
    initials: "UB",
    type: "Checking",
    currency: "PHP",
    accountNumber: "**** **** 2744",
    balance: 315240.11,
    lastSynced: "Just now",
    status: "synced",
    accent: "primary",
    monthlyChange: 8.14,
  },
  {
    id: "gcash-wallet",
    bank: "GCash",
    initials: "GC",
    type: "E-Wallet",
    currency: "PHP",
    accountNumber: "**** **** 0117",
    balance: 18240.89,
    lastSynced: "4 min ago",
    status: "synced",
    accent: "secondary",
    monthlyChange: 12.6,
  },
  {
    id: "maya-wallet",
    bank: "Maya",
    initials: "MY",
    type: "E-Wallet",
    currency: "PHP",
    accountNumber: "**** **** 6671",
    balance: 52400.25,
    lastSynced: "14 min ago",
    status: "error",
    accent: "error",
    monthlyChange: -1.54,
  },
  {
    id: "wise-usd",
    bank: "Wise",
    initials: "WI",
    type: "Investment",
    currency: "USD",
    accountNumber: "**** **** 4008",
    balance: 6320.95,
    lastSynced: "11 min ago",
    status: "synced",
    accent: "secondary",
    monthlyChange: 3.47,
  },
];

export const netWorthTrend = [
  { month: "Nov", value: 920000 },
  { month: "Dec", value: 954000 },
  { month: "Jan", value: 988000 },
  { month: "Feb", value: 1014000 },
  { month: "Mar", value: 1089000 },
  { month: "Apr", value: 1110381.12 },
];

export const quickStats = [
  { label: "Monthly Income", value: 245000, delta: 6.2, icon: "TrendingUp" },
  { label: "Monthly Expenses", value: 138420.75, delta: -3.1, icon: "ArrowDownUp" },
  { label: "Savings Rate", value: 43.5, delta: 2.4, icon: "PiggyBank" },
  { label: "Upcoming Bills", value: 7, delta: 1.0, icon: "CalendarClock" },
];

export const categorySpend = [
  { name: "Housing", value: 42250.5 },
  { name: "Food", value: 18820.15 },
  { name: "Transport", value: 12640.3 },
  { name: "Utilities", value: 10110.8 },
  { name: "Shopping", value: 14580.0 },
  { name: "Investments", value: 19200.0 },
];

export const transactions: Transaction[] = [
  {
    id: "txn-1",
    date: "2026-04-17",
    bank: "BPI",
    initials: "BP",
    merchant: "Ayala Malls",
    description: "Retail purchase",
    category: "Shopping",
    amount: -4680.25,
    status: "completed",
    kind: "Expense",
  },
  {
    id: "txn-2",
    date: "2026-04-16",
    bank: "UnionBank",
    initials: "UB",
    merchant: "Client Retainer",
    description: "Consulting payout",
    category: "Income",
    amount: 85000.0,
    status: "completed",
    kind: "Income",
  },
  {
    id: "txn-3",
    date: "2026-04-16",
    bank: "GCash",
    initials: "GC",
    merchant: "Meralco",
    description: "Electric bill",
    category: "Utilities",
    amount: -3920.45,
    status: "pending",
    kind: "Pending",
  },
  {
    id: "txn-4",
    date: "2026-04-15",
    bank: "BDO",
    initials: "BD",
    merchant: "Cebu Pacific",
    description: "Flight booking",
    category: "Travel",
    amount: -11890.0,
    status: "flagged",
    kind: "Expense",
  },
  {
    id: "txn-5",
    date: "2026-04-15",
    bank: "Maya",
    initials: "MY",
    merchant: "Transfer to BPI",
    description: "Wallet top-up transfer",
    category: "Transfer",
    amount: -12000.0,
    status: "completed",
    kind: "Transfer",
  },
  {
    id: "txn-6",
    date: "2026-04-14",
    bank: "Wise",
    initials: "WI",
    merchant: "USD Dividend",
    description: "Portfolio distribution",
    category: "Investments",
    amount: 540.8,
    status: "completed",
    kind: "Income",
  },
  {
    id: "txn-7",
    date: "2026-04-13",
    bank: "BPI",
    initials: "BP",
    merchant: "Landers",
    description: "Groceries",
    category: "Food",
    amount: -6820.2,
    status: "completed",
    kind: "Expense",
  },
  {
    id: "txn-8",
    date: "2026-04-12",
    bank: "UnionBank",
    initials: "UB",
    merchant: "Condo Dues",
    description: "Monthly dues",
    category: "Housing",
    amount: -12500.0,
    status: "completed",
    kind: "Expense",
  },
  {
    id: "txn-9",
    date: "2026-04-11",
    bank: "GCash",
    initials: "GC",
    merchant: "Grab",
    description: "Transport rides",
    category: "Transport",
    amount: -980.4,
    status: "completed",
    kind: "Expense",
  },
  {
    id: "txn-10",
    date: "2026-04-10",
    bank: "BDO",
    initials: "BD",
    merchant: "Interest Charge",
    description: "Card finance charge",
    category: "Bank Fees",
    amount: -1220.0,
    status: "completed",
    kind: "Expense",
  },
];

export const budgetItems = [
  { category: "Housing", spent: 42250.5, limit: 60000 },
  { category: "Food", spent: 18820.15, limit: 24000 },
  { category: "Transport", spent: 12640.3, limit: 15000 },
  { category: "Shopping", spent: 14580, limit: 15000 },
  { category: "Utilities", spent: 10110.8, limit: 12000 },
  { category: "Travel", spent: 11890, limit: 10000 },
];

export const monthlyComparison = [
  { month: "May", income: 210000, expenses: 134000, savings: 76000 },
  { month: "Jun", income: 198000, expenses: 129500, savings: 68500 },
  { month: "Jul", income: 221000, expenses: 147800, savings: 73200 },
  { month: "Aug", income: 228000, expenses: 138900, savings: 89100 },
  { month: "Sep", income: 232000, expenses: 142300, savings: 89700 },
  { month: "Oct", income: 225000, expenses: 150250, savings: 74750 },
  { month: "Nov", income: 236000, expenses: 144200, savings: 91800 },
  { month: "Dec", income: 281000, expenses: 186400, savings: 94600 },
  { month: "Jan", income: 219000, expenses: 140100, savings: 78900 },
  { month: "Feb", income: 238000, expenses: 146220, savings: 91780 },
  { month: "Mar", income: 242500, expenses: 141100, savings: 101400 },
  { month: "Apr", income: 245000, expenses: 138420.75, savings: 106579.25 },
];

export const bankBreakdown = [
  { bank: "BPI", value: 842500.42 },
  { bank: "UnionBank", value: 315240.11 },
  { bank: "GCash", value: 18240.89 },
  { bank: "Maya", value: 52400.25 },
  { bank: "Wise", value: 364500.0 },
  { bank: "BDO", value: -124320.55 },
];

export const cashFlowWaterfall = [
  { name: "Opening", value: 1000000 },
  { name: "Income", value: 245000 },
  { name: "Expenses", value: -138420.75 },
  { name: "Investments", value: -19200 },
  { name: "Debt Paydown", value: -18450 },
  { name: "Closing", value: 1068929.25 },
];

export const goals = [
  { name: "Emergency Fund", saved: 420000, target: 600000 },
  { name: "Tokyo Trip", saved: 182000, target: 250000 },
  { name: "Home Downpayment", saved: 1180000, target: 2000000 },
];
