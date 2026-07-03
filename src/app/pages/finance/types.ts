export type AccountType = "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  description: string;
  balance?: number;
}

export type FiscalYearStatus = "open" | "closing" | "closed";

export interface FiscalYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: FiscalYearStatus;
  isCurrent: boolean;
  closedAt?: string;
  closedBy?: string;
  openingBalances?: Record<string, number>;
}

export type AccrualType =
  | "goods-received-not-invoiced"
  | "accrued-expense"
  | "prepaid-expense"
  | "accrued-revenue"
  | "deferred-revenue";

export type AccrualStatus =
  | "active"
  | "partially-reversed"
  | "fully-reversed"
  | "cancelled";

export interface Accrual {
  id: string;
  type: AccrualType;
  title: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  status: AccrualStatus;
  createdAt: string;
  createdBy: string;
  reversalDate: string;
  reversedAt?: string;
  reversedAmount?: number;
  reference: string;
  sourceModule: string;
  sourceRef: string;
  fiscalYearId: string;
  notes?: string;
}

export type TxnType =
  | "Income" | "Expense" | "Payroll" | "Payment"
  | "Transfer" | "Adjustment" | "Journal" | "Accrual";

export const ACCOUNT_TYPES: AccountType[] = [
  "Assets", "Liabilities", "Equity", "Income", "Expenses",
];

export const ACCRUAL_LABELS: Record<AccrualType, string> = {
  "goods-received-not-invoiced": "Goods Received Not Invoiced",
  "accrued-expense": "Accrued Expense",
  "prepaid-expense": "Prepaid Expense",
  "accrued-revenue": "Accrued Revenue",
  "deferred-revenue": "Deferred Revenue",
};

export const ACCRUAL_COLORS: Record<AccrualType, string> = {
  "goods-received-not-invoiced": "bg-blue-100 text-blue-700",
  "accrued-expense": "bg-amber-100 text-amber-700",
  "prepaid-expense": "bg-purple-100 text-purple-700",
  "accrued-revenue": "bg-emerald-100 text-emerald-700",
  "deferred-revenue": "bg-orange-100 text-orange-700",
};

export const ACCRUAL_STATUS_LABELS: Record<AccrualStatus, string> = {
  active: "Active",
  "partially-reversed": "Partially Reversed",
  "fully-reversed": "Fully Reversed",
  cancelled: "Cancelled",
};

export const ACCRUAL_STATUS_COLORS: Record<AccrualStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  "partially-reversed": "bg-amber-100 text-amber-700",
  "fully-reversed": "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};
