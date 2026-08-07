import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type {
  Account, AccountType, FiscalYear, FiscalYearStatus,
  Accrual, AccrualType, AccrualStatus, TxnType, AccrualTypeConfig,
} from "../pages/finance/types";

// ── Journal / posting line ─────────────────────────────────────────────────
export interface LedgerLine {
  id: string;
  account: string;   // "<code> <name>" (matches store account)
  debit: number;
  credit: number;
  description: string;
}

// ── Transaction type (from TransactionsLedger) ─────────────────────────────
export interface Transaction {
  id: string; type: TxnType; description: string;
  debitAccount: string; creditAccount: string;
  reference: string; amount: number; date: string; createdBy: string;
  sourceApp: string; sourceProcess: string;
  approvalStatus: "approved" | "pending" | "auto-approved";
  linkedRecords?: { label: string; ref: string }[];
  notes?: string;
  fiscalYearId?: string;
  // Multi-line (double-entry) postings. When present, balances are derived from
  // lines; otherwise they fall back to the single debit/credit pair above.
  lines?: LedgerLine[];
}

// src for the shared posting constructor passed by modules (Journal, Invoice,
// Payment, Posting Engine). Exported so forms can type the account selector.
export interface PostingInput {
  id: string;
  type: TxnType;
  description: string;
  reference: string;
  date: string;
  createdBy: string;
  sourceApp: string;
  sourceProcess: string;
  lines: LedgerLine[];
  notes?: string;
  linkedRecords?: { label: string; ref: string }[];
  fiscalYearId?: string;
}

// ── Context shape ──────────────────────────────────────────────────────────
interface FinanceContextValue {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  fiscalYears: FiscalYear[];
  setFiscalYears: React.Dispatch<React.SetStateAction<FiscalYear[]>>;
  accruals: Accrual[];
  setAccruals: React.Dispatch<React.SetStateAction<Accrual[]>>;
  accrualTypeConfigs: AccrualTypeConfig[];
  setAccrualTypeConfigs: React.Dispatch<React.SetStateAction<AccrualTypeConfig[]>>;

  getAccountBalance: (accountId: string) => number;
  getAccountsByType: (type: AccountType) => Account[];
  getDescendantIds: (parentId: string) => string[];
  getPostableAccounts: () => Account[];
  postTransaction: (input: PostingInput) => Transaction | null;
  getTrialBalance: (fiscalYearId?: string) => TrialBalanceRow[];
  getBalanceSheet: (fiscalYearId?: string) => BalanceSheetSection[];
  getIncomeStatement: (fiscalYearId?: string) => IncomeStatementRow[];
}

export interface TrialBalanceRow {
  code: string;
  accountName: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface BalanceSheetSection {
  section: string;
  total: number;
  items: { account: string; code: string; amount: number }[];
}

export interface IncomeStatementRow {
  label: string;
  amount: number;
  isTotal?: boolean;
  isSection?: boolean;
}

// ── Seed Accounts ──────────────────────────────────────────────────────────
const SEED_ACCOUNTS: Account[] = [
  { id: "a1",  code: "1000", name: "Assets",                type: "Assets",      parentId: null, description: "All asset accounts" },
  { id: "a2",  code: "1100", name: "Current Assets",        type: "Assets",      parentId: "a1",  description: "Short-term assets" },
  { id: "a3",  code: "1110", name: "Cash & Bank",           type: "Assets",      parentId: "a2",  description: "Cash on hand and bank balances" },
  { id: "a4",  code: "1120", name: "Accounts Receivable",   type: "Assets",      parentId: "a2",  description: "Amounts owed by customers" },
  { id: "a5",  code: "1200", name: "Fixed Assets",          type: "Assets",      parentId: "a1",  description: "Long-term physical assets" },
  { id: "a6",  code: "1210", name: "Plant & Equipment",     type: "Assets",      parentId: "a5",  description: "Machinery and equipment" },
  { id: "a7",  code: "2000", name: "Liabilities",           type: "Liabilities", parentId: null, description: "All liability accounts" },
  { id: "a8",  code: "2100", name: "Current Liabilities",   type: "Liabilities", parentId: "a7",  description: "Short-term obligations" },
  { id: "a9",  code: "2110", name: "Accounts Payable",      type: "Liabilities", parentId: "a8",  description: "Amounts owed to suppliers" },
  { id: "a10", code: "2120", name: "Accrued Expenses",      type: "Liabilities", parentId: "a8",  description: "Expenses incurred but not yet paid" },
  { id: "a11", code: "3000", name: "Equity",                type: "Equity",      parentId: null, description: "Owner's equity" },
  { id: "a12", code: "3100", name: "Retained Earnings",     type: "Equity",      parentId: "a11", description: "Accumulated profits" },
  { id: "a13", code: "4000", name: "Income",                type: "Income",      parentId: null, description: "All income accounts" },
  { id: "a14", code: "4100", name: "Contract Revenue",      type: "Income",      parentId: "a13", description: "Revenue from construction contracts" },
  { id: "a15", code: "4200", name: "Service Income",        type: "Income",      parentId: "a13", description: "Revenue from services rendered" },
  { id: "a16", code: "5000", name: "Expenses",              type: "Expenses",    parentId: null, description: "All expense accounts" },
  { id: "a17", code: "5100", name: "Labour Costs",          type: "Expenses",    parentId: "a16", description: "Wages and salaries" },
  { id: "a18", code: "5200", name: "Material Costs",        type: "Expenses",    parentId: "a16", description: "Raw materials and supplies" },
  { id: "a19", code: "5300", name: "Equipment Costs",       type: "Expenses",    parentId: "a16", description: "Equipment hire and maintenance" },
  { id: "a20", code: "5400", name: "Overhead",              type: "Expenses",    parentId: "a16", description: "General overhead costs" },
  { id: "a21", code: "1130", name: "Input VAT",             type: "Assets",      parentId: "a2",  description: "Recoverable input VAT" },
  { id: "a22", code: "2130", name: "VAT Payable",           type: "Liabilities", parentId: "a8",  description: "Output VAT owed to tax authorities" },
  { id: "a23", code: "2140", name: "WHT Payable",           type: "Liabilities", parentId: "a8",  description: "Withholding tax deducted and payable" },
];

// ── Seed posted ledger transactions ────────────────────────────────────────
// Represent posted (approved) postings from Journal Entries, Payment Entries,
// and Purchasing. These drive Chart of Accounts balances via getAccountBalance.
const SEED_LEDGER: Transaction[] = [
  {
    id: "LGR-1001", type: "Journal", description: "Site materials purchase – Block A", reference: "REF-EXP-0041",
    amount: 2400000, date: "2026-04-01", createdBy: "Amara Lawson", sourceApp: "Finance", sourceProcess: "Journal Entry",
    approvalStatus: "approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Journal Entry", ref: "JE-001" }],
    debitAccount: "5200 Material Costs", creditAccount: "1110 Cash & Bank",
    lines: [
      { id: "ls-1a", account: "5200 Material Costs", debit: 2400000, credit: 0, description: "Cement & rebar" },
      { id: "ls-1b", account: "1110 Cash & Bank", debit: 0, credit: 2400000, description: "Paid from ops account" },
    ],
  },
  {
    id: "LGR-1002", type: "Journal", description: "Progress billing – Phase 1", reference: "REF-INC-0018",
    amount: 8500000, date: "2026-04-03", createdBy: "Femi Bode", sourceApp: "Finance", sourceProcess: "Journal Entry",
    approvalStatus: "approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Journal Entry", ref: "JE-002" }],
    debitAccount: "1120 Accounts Receivable", creditAccount: "4100 Contract Revenue",
    lines: [
      { id: "ls-2a", account: "1120 Accounts Receivable", debit: 8500000, credit: 0, description: "Invoice INV-0018" },
      { id: "ls-2b", account: "4100 Contract Revenue", debit: 0, credit: 8500000, description: "Phase 1 completion billing" },
    ],
  },
  {
    id: "LGR-1003", type: "Journal", description: "April 2026 payroll", reference: "PAYROLL-APR-2026",
    amount: 12400000, date: "2026-04-07", createdBy: "HR System", sourceApp: "Finance", sourceProcess: "Journal Entry",
    approvalStatus: "approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Journal Entry", ref: "JE-003" }],
    debitAccount: "5100 Labour Costs", creditAccount: "1110 Cash & Bank",
    lines: [
      { id: "ls-3a", account: "5100 Labour Costs", debit: 12400000, credit: 0, description: "Net salaries" },
      { id: "ls-3b", account: "1110 Cash & Bank", debit: 0, credit: 10800000, description: "Net pay to employees" },
      { id: "ls-3c", account: "2140 WHT Payable", debit: 0, credit: 1600000, description: "PAYE withheld" },
    ],
  },
  {
    id: "LGR-1004", type: "Payment", description: "Supplier invoice payment – CemCo Nigeria Ltd", reference: "PO-2025-014",
    amount: 4950000, date: "2026-04-09", createdBy: "Sola Adeleke", sourceApp: "Finance", sourceProcess: "Purchase Invoice Payment",
    approvalStatus: "approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Invoice", ref: "PI-001" }],
    debitAccount: "2110 Accounts Payable", creditAccount: "1110 Cash & Bank",
    lines: [
      { id: "ls-4a", account: "2110 Accounts Payable", debit: 4950000, credit: 0, description: "Settle CemCo invoice" },
      { id: "ls-4b", account: "1110 Cash & Bank", debit: 0, credit: 4950000, description: "Bank transfer" },
    ],
  },
  {
    id: "LGR-1005", type: "Journal", description: "Supplier invoice accrual – SteelMart PO-2025-012", reference: "INV-STL-0089",
    amount: 8340000, date: "2026-04-10", createdBy: "Emeka Obi", sourceApp: "Procurement", sourceProcess: "Purchase Invoice",
    approvalStatus: "approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Invoice", ref: "PI-002" }],
    debitAccount: "5200 Material Costs", creditAccount: "2110 Accounts Payable",
    lines: [
      { id: "ls-5a", account: "5200 Material Costs", debit: 8340000, credit: 0, description: "Steel Rebar Y16 & binding wire" },
      { id: "ls-5b", account: "2110 Accounts Payable", debit: 0, credit: 8340000, description: "Amount due to SteelMart" },
    ],
  },
  {
    id: "LGR-1006", type: "Payment", description: "Payroll disbursement – March 2026", reference: "PAY-2603",
    amount: 4620000, date: "2026-04-01", createdBy: "Ngozi Adeyemi", sourceApp: "HR", sourceProcess: "Payroll Disbursement",
    approvalStatus: "auto-approved", fiscalYearId: "fy2", linkedRecords: [{ label: "Posting Engine Ref", ref: "TXN-2026-002" }],
    debitAccount: "5100 Labour Costs", creditAccount: "1110 Cash & Bank",
    lines: [
      { id: "ls-6a", account: "5100 Labour Costs", debit: 4620000, credit: 0, description: "March payroll" },
      { id: "ls-6b", account: "1110 Cash & Bank", debit: 0, credit: 4620000, description: "Net pay" },
    ],
  },
  {
    id: "LGR-1007", type: "Adjustment", description: "Opening capital injection", reference: "OPN-2026",
    amount: 30000000, date: "2026-01-05", createdBy: "Sola Adeleke", sourceApp: "Finance", sourceProcess: "Opening Balance",
    approvalStatus: "approved", fiscalYearId: "fy2",
    debitAccount: "1110 Cash & Bank", creditAccount: "3100 Retained Earnings",
    lines: [
      { id: "ls-7a", account: "1110 Cash & Bank", debit: 30000000, credit: 0, description: "Capital injection" },
      { id: "ls-7b", account: "3100 Retained Earnings", debit: 0, credit: 30000000, description: "Opening capital" },
    ],
  },
];

// ── Seed Fiscal Years ──────────────────────────────────────────────────────
const SEED_FISCAL_YEARS: FiscalYear[] = [
  { id: "fy1", label: "FY 2025", startDate: "2025-01-01", endDate: "2025-12-31", status: "closed", isCurrent: false, closedAt: "2026-01-15", closedBy: "Sola Adeleke" },
  { id: "fy2", label: "FY 2026", startDate: "2026-01-01", endDate: "2026-12-31", status: "open", isCurrent: true },
];

// ── Seed Accruals ──────────────────────────────────────────────────────────
const SEED_ACCRUALS: Accrual[] = [
  {
    id: "acc-001", type: "goods-received-not-invoiced",
    title: "GRNI — CemCo Cement Delivery",
    description: "400 bags cement received, invoice pending from CemCo Nigeria Ltd",
    lines: [{ id: "al-1", account: "5200 Material Costs", description: "Cement stock", debit: 3400000, credit: 0 }, { id: "al-2", account: "2120 Accrued Expenses", description: "Accrual for unpaid invoice", debit: 0, credit: 3400000 }],
    amount: 3400000,
    status: "active", approvalStatus: "approved", approvalSteps: [],
    createdAt: "2026-04-10", createdBy: "Amaka Osei",
    reversalDate: "2026-05-10", reference: "PO-0031", sourceModule: "Procurement",
    sourceRef: "PO-0031", fiscalYearId: "fy2",
  },
  {
    id: "acc-002", type: "accrued-expense",
    title: "April Payroll Accrual",
    description: "Unpaid salaries for last week of April",
    lines: [{ id: "al-3", account: "5100 Labour Costs", description: "Salary accrual", debit: 1250000, credit: 0 }, { id: "al-4", account: "2120 Accrued Expenses", description: "Liability for unpaid salaries", debit: 0, credit: 1250000 }],
    amount: 1250000,
    status: "active", approvalStatus: "approved", approvalSteps: [],
    createdAt: "2026-04-30", createdBy: "Ngozi Okafor",
    reversalDate: "2026-05-07", reference: "PRLL-APR26-ACCRUAL", sourceModule: "HR",
    sourceRef: "PRLL-APR26", fiscalYearId: "fy2",
  },
  {
    id: "acc-003", type: "prepaid-expense",
    title: "Q2 Insurance Premium",
    description: "Prepaid insurance for April–June 2026",
    lines: [{ id: "al-5", account: "1100 Current Assets", description: "Prepaid insurance", debit: 240000, credit: 0 }, { id: "al-6", account: "1110 Cash & Bank", description: "Payment", debit: 0, credit: 240000 }],
    amount: 240000,
    status: "partially-reversed", approvalStatus: "approved", approvalSteps: [],
    createdAt: "2026-04-01", createdBy: "Sola Adeleke",
    reversalDate: "2026-07-01", reversedAmount: 80000, reference: "INS-Q2-2026",
    sourceModule: "Finance", sourceRef: "JRN-0032", fiscalYearId: "fy2",
  },
  {
    id: "acc-004", type: "deferred-revenue",
    title: "Mobilisation Fee — Riverside Phase 2",
    description: "Client advance payment for project mobilisation",
    lines: [{ id: "al-7", account: "1110 Cash & Bank", description: "Client advance received", debit: 5000000, credit: 0 }, { id: "al-8", account: "2100 Current Liabilities", description: "Deferred revenue liability", debit: 0, credit: 5000000 }],
    amount: 5000000,
    status: "active", approvalStatus: "approved", approvalSteps: [],
    createdAt: "2026-03-15", createdBy: "Sola Adeleke",
    reversalDate: "2026-09-15", reference: "INC-0016", sourceModule: "Projects",
    sourceRef: "PROJ-0008", fiscalYearId: "fy2",
  },
];

// ── Seed Accrual Type Configs ─────────────────────────────────────────────
const SEED_ACCRUAL_TYPE_CONFIGS: AccrualTypeConfig[] = [
  { id: "atc-1", type: "goods-received-not-invoiced", label: "Goods Received Not Invoiced", color: "bg-blue-100 text-blue-700", description: "Goods received but invoice not yet processed" },
  { id: "atc-2", type: "accrued-expense",              label: "Accrued Expense",              color: "bg-amber-100 text-amber-700", description: "Expenses incurred but not yet paid" },
  { id: "atc-3", type: "prepaid-expense",              label: "Prepaid Expense",              color: "bg-purple-100 text-purple-700", description: "Expenses paid in advance" },
  { id: "atc-4", type: "accrued-revenue",             label: "Accrued Revenue",              color: "bg-emerald-100 text-emerald-700", description: "Revenue earned but not yet billed" },
  { id: "atc-5", type: "deferred-revenue",            label: "Deferred Revenue",            color: "bg-orange-100 text-orange-700", description: "Revenue received but not yet earned" },
];

// ── Context ────────────────────────────────────────────────────────────────
const FinanceContext = createContext<FinanceContextValue | null>(null);

// Normalise a transaction into postable lines. Multi-line postings use their
// lines directly; legacy single debit/credit pairs fall back to two lines.
function txnLines(txn: Transaction): LedgerLine[] {
  if (txn.lines && txn.lines.length > 0) return txn.lines;
  if (txn.debitAccount && txn.creditAccount) {
    return [
      { id: `${txn.id}-d`, account: txn.debitAccount, debit: Math.abs(txn.amount), credit: 0, description: "" },
      { id: `${txn.id}-c`, account: txn.creditAccount, credit: Math.abs(txn.amount), debit: 0, description: "" },
    ];
  }
  return [];
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_LEDGER);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(SEED_FISCAL_YEARS);
  const [accruals, setAccruals] = useState<Accrual[]>(SEED_ACCRUALS);
  const [accrualTypeConfigs, setAccrualTypeConfigs] = useState<AccrualTypeConfig[]>(SEED_ACCRUAL_TYPE_CONFIGS);

  const getDescendantIds = useCallback((parentId: string): string[] => {
    const children = accounts.filter(a => a.parentId === parentId);
    return [
      parentId,
      ...children.flatMap(c => getDescendantIds(c.id)),
    ];
  }, [accounts]);

  // Postable accounts — leaf (postable) accounts within the Chart of Accounts.
  const getPostableAccounts = useCallback((): Account[] =>
    accounts.filter(a => a.parentId !== null && !accounts.some(c => c.parentId === a.id)),
  [accounts]);

  // ── Central posting mechanism ────────────────────────────────────────────
  // Every module (Journal Entry, Payment Entry, Purchasing, Posting Engine)
  // routes its postings through this single entry point. Draft transactions
  // must NOT call this — only posted/approved accounting events do.
  const postTransaction = useCallback((input: PostingInput): Transaction | null => {
    const totalDebits = input.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredits = input.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (totalDebits !== totalCredits || totalDebits <= 0) return null;

    const txn: Transaction = {
      id: input.id,
      type: input.type,
      description: input.description,
      reference: input.reference,
      date: input.date,
      createdBy: input.createdBy,
      sourceApp: input.sourceApp,
      sourceProcess: input.sourceProcess,
      approvalStatus: "approved",
      amount: totalDebits,
      debitAccount: input.lines.find(l => l.debit)?.account ?? "",
      creditAccount: input.lines.find(l => l.credit)?.account ?? "",
      lines: input.lines,
      notes: input.notes,
      linkedRecords: input.linkedRecords,
      fiscalYearId: input.fiscalYearId,
    };
    setTransactions(prev => [...prev, txn]);
    return txn;
  }, []);

  const getAccountBalance = useCallback((accountId: string): number => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const descendantIds = getDescendantIds(accountId);
    const isDebitType = account.type === "Assets" || account.type === "Expenses";

    let balance = 0;
    for (const txn of transactions) {
      for (const line of txnLines(txn)) {
        const matches = descendantIds.some(id => {
          const a = accounts.find(ac => ac.id === id);
          return a && line.account.includes(a.code);
        });
        if (!matches) continue;
        balance += (line.debit || 0) - (line.credit || 0);
      }
    }

    return isDebitType ? balance : -balance;
  }, [accounts, transactions, getDescendantIds]);

  const getAccountsByType = useCallback((type: AccountType) =>
    accounts.filter(a => a.type === type),
  [accounts]);

  // ── Trial Balance ──────────────────────────────────────────────────────
  const getTrialBalance = useCallback((fiscalYearId?: string): TrialBalanceRow[] => {
    const filtered = fiscalYearId
      ? transactions.filter(t => t.fiscalYearId === fiscalYearId)
      : transactions;

    const accountBalances: Record<string, { debit: number; credit: number }> = {};

    for (const account of accounts) {
      if (account.parentId !== null) continue; // only top-level
      const descIds = getDescendantIds(account.id);
      let dr = 0; let cr = 0;
      for (const txn of filtered) {
        for (const line of txnLines(txn)) {
          const matches = descIds.some(id => {
            const a = accounts.find(ac => ac.id === id);
            return a && line.account.includes(a.code);
          });
          if (!matches) continue;
          if (line.debit) {
            if (account.type === "Assets" || account.type === "Expenses") dr += line.debit;
            else cr += line.debit;
          }
          if (line.credit) {
            if (account.type === "Liabilities" || account.type === "Equity" || account.type === "Income") cr += line.credit;
            else dr += line.credit;
          }
        }
      }
      accountBalances[account.id] = { debit: dr, credit: cr };
    }

    return accounts
      .filter(a => a.parentId === null)
      .map(a => ({
        code: a.code,
        accountName: a.name,
        type: a.type,
        debit: accountBalances[a.id]?.debit ?? 0,
        credit: accountBalances[a.id]?.credit ?? 0,
      }));
  }, [accounts, transactions, getDescendantIds]);

  // ── Balance Sheet ──────────────────────────────────────────────────────
  const getBalanceSheet = useCallback((fiscalYearId?: string): BalanceSheetSection[] => {
    const tb = getTrialBalance(fiscalYearId);
    const sections: BalanceSheetSection[] = [];

    const assetAccounts = tb.filter(r => r.type === "Assets");
    const assetTotal = assetAccounts.reduce((s, r) => s + r.debit - r.credit, 0);
    sections.push({
      section: "Assets",
      total: assetTotal,
      items: assetAccounts.map(r => ({ account: r.accountName, code: r.code, amount: r.debit - r.credit })),
    });

    const liabilityAccounts = tb.filter(r => r.type === "Liabilities");
    const liabilityTotal = liabilityAccounts.reduce((s, r) => s + r.credit - r.debit, 0);
    sections.push({
      section: "Liabilities",
      total: liabilityTotal,
      items: liabilityAccounts.map(r => ({ account: r.accountName, code: r.code, amount: r.credit - r.debit })),
    });

    const equityAccounts = tb.filter(r => r.type === "Equity");
    const incomeTotal = tb.filter(r => r.type === "Income").reduce((s, r) => s + r.credit - r.debit, 0);
    const expenseTotal = tb.filter(r => r.type === "Expenses").reduce((s, r) => s + r.debit - r.credit, 0);
    const netIncome = incomeTotal - expenseTotal;

    const equityItems = equityAccounts.map(r => ({ account: r.accountName, code: r.code, amount: r.credit - r.debit }));
    equityItems.push({ account: "Current Year Earnings", code: "—", amount: netIncome });
    const equityTotal = equityItems.reduce((s, i) => s + i.amount, 0);

    sections.push({
      section: "Equity",
      total: equityTotal,
      items: equityItems,
    });

    return sections;
  }, [getTrialBalance]);

  // ── Income Statement ───────────────────────────────────────────────────
  const getIncomeStatement = useCallback((fiscalYearId?: string): IncomeStatementRow[] => {
    const tb = getTrialBalance(fiscalYearId);
    const rows: IncomeStatementRow[] = [];

    const incomeAccounts = tb.filter(r => r.type === "Income");
    const totalIncome = incomeAccounts.reduce((s, r) => s + r.credit - r.debit, 0);
    rows.push({ label: "Income", amount: 0, isSection: true });
    incomeAccounts.forEach(r => rows.push({ label: `  ${r.accountName}`, amount: r.credit - r.debit }));
    rows.push({ label: "Total Income", amount: totalIncome, isTotal: true });

    rows.push({ label: "", amount: 0 });

    const expenseAccounts = tb.filter(r => r.type === "Expenses");
    const totalExpenses = expenseAccounts.reduce((s, r) => s + r.debit - r.credit, 0);
    rows.push({ label: "Expenses", amount: 0, isSection: true });
    expenseAccounts.forEach(r => rows.push({ label: `  ${r.accountName}`, amount: r.debit - r.credit }));
    rows.push({ label: "Total Expenses", amount: totalExpenses, isTotal: true });

    rows.push({ label: "", amount: 0 });
    rows.push({ label: "Net Income / (Loss)", amount: totalIncome - totalExpenses, isTotal: true });

    return rows;
  }, [getTrialBalance]);

  const value = useMemo(() => ({
    accounts, setAccounts,
    transactions, setTransactions,
    fiscalYears, setFiscalYears,
    accruals, setAccruals,
    accrualTypeConfigs, setAccrualTypeConfigs,
    getAccountBalance, getAccountsByType, getDescendantIds,
    getPostableAccounts, postTransaction,
    getTrialBalance, getBalanceSheet, getIncomeStatement,
  }), [accounts, transactions, fiscalYears, accruals, accrualTypeConfigs, getAccountBalance, getAccountsByType, getDescendantIds, getPostableAccounts, postTransaction, getTrialBalance, getBalanceSheet, getIncomeStatement]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
