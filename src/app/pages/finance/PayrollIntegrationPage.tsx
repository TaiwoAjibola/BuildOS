import { useState } from "react";
import {
  Download, CheckCircle, Clock, Send, Plus, Trash2,
  BookOpen, Zap, X, GitBranch, AlertTriangle,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { DataTable, type Column } from "../../components/DataTable";
import { useChangelog } from "../../stores/changelogStore";
import { useNumbering } from "../../stores/numberingStore";
import { useFinance, type LedgerLine } from "../../stores/financeStore";

type PayrollStatus =
  | "Draft"
  | "Sent for Approval"
  | "Approved"
  | "Pending Posting Approval"
  | "Posting Approved"
  | "Posted";

interface PayrollRun {
  id: string;
  payrollCode: string;
  month: string;
  year: string;
  period: string;
  department: string;
  headcount: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  sentForPostingBy?: string;
  sentForPostingAt?: string;
  postingApprovedBy?: string;
  postingApprovedAt?: string;
  postedBy?: string;
  postedAt?: string;
  ledgerRef?: string;
}

interface PayrollEmployee {
  name: string;
  role: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  net: number;
  bank: string;
  accountNo: string;
}

const statusConfig: Record<PayrollStatus, { badge: string; icon: React.ReactNode }> = {
  Draft:                    { badge: "bg-gray-100 text-gray-600",       icon: <Clock        className="w-3 h-3" /> },
  "Sent for Approval":      { badge: "bg-blue-100 text-blue-700",       icon: <Send         className="w-3 h-3" /> },
  Approved:                 { badge: "bg-emerald-100 text-emerald-700", icon: <CheckCircle  className="w-3 h-3" /> },
  "Pending Posting Approval": { badge: "bg-amber-100 text-amber-700",   icon: <Clock        className="w-3 h-3" /> },
  "Posting Approved":       { badge: "bg-violet-100 text-violet-700",   icon: <CheckCircle  className="w-3 h-3" /> },
  Posted:                   { badge: "bg-purple-100 text-purple-700",   icon: <BookOpen     className="w-3 h-3" /> },
};

const mockPayrollRuns: PayrollRun[] = [
  { id: "PRLL-JUL26-01", payrollCode: "PAY-001", month: "July",  year: "2026", period: "July 2026",   department: "All Departments", headcount: 150, grossPay: 6010000, deductions: 1020000, netPay: 4990000, status: "Approved",              submittedBy: "Ngozi Okafor", approvedBy: "Amaka Osei", approvedAt: "Jul 6, 2026" },
  { id: "PRLL-JUN26-01", payrollCode: "PAY-002", month: "June",  year: "2026", period: "June 2026",   department: "All Departments", headcount: 152, grossPay: 6010000, deductions: 1020000, netPay: 4990000, status: "Pending Posting Approval", submittedBy: "Ngozi Okafor", approvedBy: "Amaka Osei", approvedAt: "Jun 4, 2026", sentForPostingBy: "Sola Adeleke", sentForPostingAt: "Jun 5, 2026" },
  { id: "PRLL-MAY26-01", payrollCode: "PAY-003", month: "May",   year: "2026", period: "May 2026",    department: "All Departments", headcount: 150, grossPay: 5960000, deductions: 1010000, netPay: 4950000, status: "Posted",                submittedBy: "Ngozi Okafor", approvedBy: "Amaka Osei", approvedAt: "May 7, 2026", sentForPostingBy: "Sola Adeleke", sentForPostingAt: "May 8, 2026", postingApprovedBy: "Sola Adeleke", postingApprovedAt: "May 9, 2026", postedBy: "Sola Adeleke", postedAt: "May 9, 2026", ledgerRef: "LGR-1006" },
  { id: "PRLL-APR26-01", payrollCode: "PAY-004", month: "April", year: "2026", period: "April 2026",   department: "All Departments", headcount: 148, grossPay: 5840000, deductions: 990000, netPay: 4850000, status: "Posted",                submittedBy: "Ngozi Okafor", approvedBy: "Amaka Osei", approvedAt: "Apr 8, 2026", sentForPostingBy: "Sola Adeleke", sentForPostingAt: "Apr 8, 2026", postingApprovedBy: "Sola Adeleke", postingApprovedAt: "Apr 9, 2026", postedBy: "Sola Adeleke", postedAt: "Apr 10, 2026", ledgerRef: "LGR-1003" },
  { id: "PRLL-MAR26-01", payrollCode: "PAY-005", month: "March", year: "2026", period: "March 2026",   department: "All Departments", headcount: 145, grossPay: 5720000, deductions: 970000, netPay: 4750000, status: "Draft",                submittedBy: "Ngozi Okafor" },
];

const mockEmployees: PayrollEmployee[] = [
  { name: "Amaka Osei", role: "Admin", department: "IT", basicSalary: 450000, allowances: 80000, deductions: 82000, net: 448000, bank: "GTBank", accountNo: "****8821" },
  { name: "Chukwudi Eze", role: "Construction Manager", department: "Construction", basicSalary: 380000, allowances: 60000, deductions: 68000, net: 372000, bank: "Access Bank", accountNo: "****4432" },
  { name: "Sola Adeleke", role: "Accountant", department: "Finance", basicSalary: 320000, allowances: 50000, deductions: 58000, net: 312000, bank: "Zenith Bank", accountNo: "****7715" },
  { name: "Musa Ibrahim", role: "Store Manager", department: "Procurement", basicSalary: 280000, allowances: 40000, deductions: 48000, net: 272000, bank: "First Bank", accountNo: "****2290" },
  { name: "Ngozi Okafor", role: "HR Manager", department: "HR", basicSalary: 360000, allowances: 55000, deductions: 62000, net: 353000, bank: "UBA", accountNo: "****6643" },
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

// ── Posting confirmation modal ──────────────────────────────────────────────
function PostingModal({ run, lines, onConfirm, onClose }: {
  run: PayrollRun;
  lines: LedgerLine[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [posting, setPosting] = useState(false);
  const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebits > 0 && totalDebits === totalCredits;

  function handleConfirm() {
    setPosting(true);
    setTimeout(() => { onConfirm(); onClose(); }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Post Payroll to General Ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">{run.payrollCode} · {run.period} · Net pay {fmt(run.netPay)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <GitBranch className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800">Lines are built from the <strong>Payroll Disbursement</strong> process mapping in the Posting Engine.</p>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Journal Lines</p>
              <span className={`text-xs font-bold ${balanced ? "text-emerald-600" : "text-red-600"}`}>
                {balanced ? "✓ Balanced" : "⚠ Not balanced"}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-semibold">Account</th>
                  <th className="px-4 py-2 text-right font-semibold">DR</th>
                  <th className="px-4 py-2 text-right font-semibold">CR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lines.map(l => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{l.account}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{l.debit ? fmt(l.debit) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-red-600">{l.credit ? fmt(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-100 bg-gray-50">
                <tr>
                  <td className="px-4 py-2 text-xs font-semibold text-gray-500">Totals</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{fmt(totalDebits)}</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-red-600">{fmt(totalCredits)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
            {posting ? <Zap className="w-4 h-4 text-emerald-600 animate-pulse" /> : <BookOpen className="w-4 h-4 text-emerald-600" />}
            <p className="text-xs text-emerald-800">{posting ? "Posting to the general ledger…" : "This posts a double-entry to the General Ledger and updates Chart of Accounts balances."}</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} disabled={!balanced || posting}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40">
            <BookOpen className="w-4 h-4" /> {posting ? "Posting…" : "Confirm & Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Run detail drawer (slide-over) ────────────────────────────────────────
const employeeColumns: Column<PayrollEmployee>[] = [
  {
    key: "employee",
    label: "Employee",
    render: (e) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{e.name}</p>
        <p className="text-xs text-gray-400">{e.role}</p>
      </div>
    ),
  },
  { key: "basic", label: "Basic", className: "text-right", headerClassName: "text-right", render: (e) => <span className="text-sm text-gray-700">{fmt(e.basicSalary)}</span> },
  { key: "allowances", label: "Allowances", className: "text-right", headerClassName: "text-right", render: (e) => <span className="text-sm text-emerald-600">+{fmt(e.allowances)}</span> },
  { key: "deductions", label: "Deductions", className: "text-right", headerClassName: "text-right", render: (e) => <span className="text-sm text-red-600">−{fmt(e.deductions)}</span> },
  { key: "net", label: "Net", className: "text-right font-semibold text-gray-900", headerClassName: "text-right", render: (e) => <span>{fmt(e.net)}</span> },
  { key: "bank", label: "Bank", render: (e) => <span className="text-xs text-gray-500">{e.bank} {e.accountNo}</span> },
];

function RunDrawer({ run, actions, onClose }: {
  run: PayrollRun;
  actions?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-xl shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">{run.payrollCode} · {run.id} · {run.department}</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-0.5">{run.period} Payroll</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${statusConfig[run.status].badge}`}>
              {statusConfig[run.status].icon}{run.status}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Total Earnings</p><p className="text-lg font-bold text-gray-900 mt-1">{fmt(run.grossPay)}</p></div>
            <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Total Deductions</p><p className="text-lg font-bold text-red-600 mt-1">−{fmt(run.deductions)}</p></div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Net Pay</p><p className="text-lg font-bold text-emerald-700 mt-1">{fmt(run.netPay)}</p></div>
          </div>

          {/* Audit trail */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Audit Trail</h3>
            <div className="space-y-2.5">
              {run.submittedBy && <p className="text-xs text-gray-500">Submitted by <span className="font-medium text-gray-700">{run.submittedBy}</span></p>}
              {run.approvedBy && <p className="text-xs text-gray-500">HR approved by <span className="font-medium text-gray-700">{run.approvedBy}</span> on {run.approvedAt}</p>}
              {run.sentForPostingBy && <p className="text-xs text-gray-500">Sent for posting approval by <span className="font-medium text-gray-700">{run.sentForPostingBy}</span> on {run.sentForPostingAt}</p>}
              {run.postingApprovedBy && <p className="text-xs text-gray-500">Posting approved by <span className="font-medium text-gray-700">{run.postingApprovedBy}</span> on {run.postingApprovedAt}</p>}
              {run.postedBy
                ? <p className="text-xs text-emerald-600 font-medium">✓ Posted to ledger <span className="font-mono">{run.ledgerRef}</span> by {run.postedBy} on {run.postedAt}</p>
                : <p className="text-xs text-gray-400">Not yet posted to the general ledger</p>}
            </div>
          </div>

          {/* Employee breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Employee Pay Breakdown</h3>
            <DataTable
              columns={employeeColumns}
              data={mockEmployees}
              keyExtractor={(e) => e.name}
              pageSize={10}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
          {actions ?? <span className="text-xs text-gray-400">Process mapping: Payroll Disbursement</span>}
          <div className="flex items-center gap-2 shrink-0">
            {actions && <span className="text-xs text-gray-400 hidden md:block">Process mapping: Payroll Disbursement</span>}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayrollIntegrationPage() {
  const { logChange } = useChangelog();
  const { getNextId } = useNumbering();
  const { postTransaction, buildProcessPosting } = useFinance();

  const [payrolls, setPayrolls] = useState<PayrollRun[]>(mockPayrollRuns);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [postingTarget, setPostingTarget] = useState<PayrollRun | null>(null);

  // ── Posting actions ──────────────────────────────────────────────────────
  function markStatus(id: string, patch: Partial<PayrollRun>, changelog: string) {
    setPayrolls((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSelectedRun((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    logChange({ module: "Finance", action: "StatusChanged", entityType: "PayrollRun", entityId: id, summary: changelog, performedBy: "Current User" });
  }

  function sendForPostingApproval(id: string) {
    markStatus(id, { status: "Pending Posting Approval", sentForPostingBy: "Current User", sentForPostingAt: "Today" }, `Payroll sent for posting approval — posting not yet created`);
  }

  function approvePosting(id: string) {
    markStatus(id, { status: "Posting Approved", postingApprovedBy: "Finance Manager", postingApprovedAt: "Today" }, `Payroll posting approved — ready to post to ledger`);
  }

  function postRun(run: PayrollRun) {
    // Build journal lines from the Process Account Mapping for Payroll Disbursement.
    const lines = buildProcessPosting("Payroll Disbursement", {
      "Gross Salary": run.grossPay,
      "PAYE Tax": run.deductions,
      "Net Pay": run.netPay,
    });
    const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (totalDebits === 0 || totalDebits !== totalCredits) return;

    const ledgerRef = `LGR-${String(Math.floor(1000 + Math.random() * 8999))}`;
    postTransaction({
      id: getNextId("Transaction"),
      type: "Payroll",
      description: `${run.period} payroll — ${run.payrollCode}`,
      reference: ledgerRef,
      date: new Date().toISOString().slice(0, 10),
      createdBy: "Current User",
      sourceApp: "HR",
      sourceProcess: "Payroll Disbursement",
      lines: lines.map(l => ({ ...l, debit: l.debit || 0, credit: l.credit || 0 })),
      linkedRecords: [{ label: "Payroll Run", ref: run.payrollCode }],
    });
    markStatus(run.id, { status: "Posted", postedBy: "Current User", postedAt: "Today", ledgerRef }, `Payroll ${run.payrollCode} posted to the general ledger (${ledgerRef})`);
  }

  function handleDelete(id: string) {
    setPayrolls((prev) => prev.filter((p) => p.id !== id));
    setSelectedRun((prev) => (prev && prev.id === id ? null : prev));
    logChange({ module: "Finance", action: "Deleted", entityType: "PayrollRun", entityId: id, summary: "Payroll run deleted", performedBy: "Current User" });
  }

  function handleCreate() {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = now.toLocaleString("default", { month: "long" });
    const year = String(now.getFullYear());
    const newRun: PayrollRun = {
      id: getNextId("PayrollRun"),
      payrollCode: `PAY-${String(payrolls.length + 1).padStart(3, "0")}`,
      month, year,
      period: `${month} ${year}`,
      department: "All Departments",
      headcount: 0,
      grossPay: 0,
      deductions: 0,
      netPay: 0,
      status: "Draft",
      submittedBy: "HR System",
    };
    setPayrolls((prev) => [newRun, ...prev]);
    setSelectedRun(newRun);
    logChange({ module: "Finance", action: "Created", entityType: "PayrollRun", entityId: newRun.id, summary: `Payroll run ${newRun.period} created`, performedBy: "Current User" });
  }

  function handleExport() {
    exportCSV("payroll-overview",
      ["Payroll Code", "Month", "Year", "Total Earnings", "Total Deductions", "Net Pay", "Status", "Ledger Ref"],
      payrolls.map((p) => [p.payrollCode, p.month, p.year, fmt(p.grossPay), fmt(p.deductions), fmt(p.netPay), p.status, p.ledgerRef ?? "—"]));
  }

  const payrollColumns: Column<PayrollRun>[] = [
    {
      key: "payrollCode",
      label: "Payroll Code",
      sortable: true,
      filterable: true,
      render: (r) => <span className="font-mono text-xs text-gray-600 font-medium">{r.payrollCode}</span>,
    },
    {
      key: "month",
      label: "Month",
      sortable: true,
      filterable: true,
      render: (r) => <span className="font-medium text-gray-900">{r.month}</span>,
    },
    {
      key: "year",
      label: "Year",
      sortable: true,
      filterable: true,
      render: (r) => <span className="text-sm text-gray-500">{r.year}</span>,
    },
    {
      key: "grossPay",
      label: "Total Earnings",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => <span className="text-sm text-gray-700">{fmt(r.grossPay)}</span>,
    },
    {
      key: "deductions",
      label: "Total Deductions",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => <span className="text-sm text-red-600">−{fmt(r.deductions)}</span>,
    },
    {
      key: "netPay",
      label: "Net Pay",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => <span className="font-semibold text-gray-900">{fmt(r.netPay)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (r) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[r.status].badge}`}>
          {statusConfig[r.status].icon}{r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      render: (r) => {
        if (r.status === "Draft") {
          return (
            <div className="flex items-center gap-1">
              <button onClick={() => markStatus(r.id, { status: "Approved", approvedBy: "Current User", approvedAt: "Today" }, `Payroll ${r.payrollCode} submitted and HR approved`)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
              <button onClick={() => handleDelete(r.id)} className="p-1 text-xs text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        }
        if (r.status === "Approved") {
          return (
            <button onClick={() => sendForPostingApproval(r.id)} className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700">
              Send for Posting Approval
            </button>
          );
        }
        if (r.status === "Pending Posting Approval") {
          return (
            <button onClick={() => approvePosting(r.id)} className="px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700">
              Approve Posting
            </button>
          );
        }
        if (r.status === "Posting Approved") {
          return (
            <button onClick={() => setPostingTarget(r)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
              <Zap className="w-3 h-3" /> Post
            </button>
          );
        }
        return <span className="text-xs text-gray-400">{r.ledgerRef ? "Posted" : "—"}</span>;
      },
    },
  ];

  const totalNet = payrolls.filter((p) => p.status === "Posted").reduce((s, p) => s + p.netPay, 0);
  const pendingPosting = payrolls.filter((p) => ["Approved", "Pending Posting Approval", "Posting Approved"].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payroll Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approved payroll from HR — move it through posting approval and post to the general ledger</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleCreate} className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> New Run
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">Payroll data is received from the <strong>HR module</strong>. Approved payrolls are sent for posting approval — a posting only hits the <strong>General Ledger</strong> once it is <strong>Posted</strong>.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Posted (YTD)</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{fmt(totalNet)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{payrolls.filter(p => p.status === "Posted").length} runs in ledger</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Ready to Post</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{payrolls.filter(p => p.status === "Posting Approved").length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Approved for posting</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Pending Posting Approval</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{payrolls.filter(p => p.status === "Pending Posting Approval").length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Waiting review</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Awaiting action</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingPosting}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total in workflow</p>
        </div>
      </div>

      {/* Payroll runs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable
          columns={payrollColumns}
          data={payrolls}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search payroll…"
          searchFields={[(r) => r.payrollCode, (r) => r.period, (r) => r.id]}
          onRowClick={(r) => setSelectedRun(r)}
          headerExtra={
            <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" />
            </button>
          }
          pageSize={10}
        />
      </div>

      {selectedRun && (
        <RunDrawer
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          actions={
            selectedRun.status === "Draft" ? (
              <button onClick={() => markStatus(selectedRun.id, { status: "Approved", approvedBy: "Current User", approvedAt: "Today" }, `Payroll ${selectedRun.payrollCode} submitted and HR approved`)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Submit for Approval
              </button>
            ) : selectedRun.status === "Approved" ? (
              <button onClick={() => sendForPostingApproval(selectedRun.id)} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Send for Posting Approval
              </button>
            ) : selectedRun.status === "Pending Posting Approval" ? (
              <button onClick={() => approvePosting(selectedRun.id)} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Approve Posting
              </button>
            ) : selectedRun.status === "Posting Approved" ? (
              <button onClick={() => setPostingTarget(selectedRun)} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Post to General Ledger
              </button>
            ) : selectedRun.status === "Posted" ? (
              <span className="flex items-center gap-2 text-sm text-purple-700 font-medium">
                <BookOpen className="w-4 h-4" /> Posted as {selectedRun.ledgerRef}
              </span>
            ) : undefined
          }
        />
      )}

      {postingTarget && (
        <PostingModal
          run={postingTarget}
          lines={buildProcessPosting("Payroll Disbursement", {
            "Gross Salary": postingTarget.grossPay,
            "PAYE Tax": postingTarget.deductions,
            "Net Pay": postingTarget.netPay,
          })}
          onClose={() => setPostingTarget(null)}
          onConfirm={() => { postRun(postingTarget); setPostingTarget(null); }}
        />
      )}
    </div>
  );
}