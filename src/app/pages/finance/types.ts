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

export type AccrualType = string;

export interface AccrualTypeConfig {
  id: string;
  type: AccrualType;
  label: string;
  color: string;
  description: string;
}

export type AccrualStatus =
  | "draft"
  | "pending"
  | "active"
  | "partially-reversed"
  | "fully-reversed"
  | "cancelled";

export interface AccrualLine {
  id: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
}

export interface ApprovalStep {
  role: string;
  action: "pending" | "approved" | "rejected";
  actedBy?: string;
  actedAt?: string;
  comment?: string;
}

export interface Accrual {
  id: string;
  type: AccrualType;
  title: string;
  description: string;
  lines: AccrualLine[];
  amount: number;
  status: AccrualStatus;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  approvalSteps: ApprovalStep[];
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

export const ACCRUAL_STATUS_LABELS: Record<AccrualStatus, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  active: "Active",
  "partially-reversed": "Partially Reversed",
  "fully-reversed": "Fully Reversed",
  cancelled: "Cancelled",
};

export const ACCRUAL_STATUS_COLORS: Record<AccrualStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-blue-100 text-blue-700",
  "partially-reversed": "bg-amber-100 text-amber-700",
  "fully-reversed": "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};
