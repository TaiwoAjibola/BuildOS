import { useState } from "react";
import { BarChart3, Download, FileText, TrendingUp, TrendingDown, DollarSign, ScrollText, Eye } from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import { exportCSV } from "../../utils/exportCSV";

type ReportType = "Trial Balance" | "Balance Sheet" | "Income Statement" | "Cash Flow" | "Budget vs Actual";

interface ReportTemplate {
  id: string;
  type: ReportType;
  icon: React.ReactNode;
  description: string;
  color: string;
  bg: string;
}

const templates: ReportTemplate[] = [
  { id: "trial-balance", type: "Trial Balance", icon: <ScrollText className="w-5 h-5" />, description: "List of all accounts with debit/credit balances — verifies books are balanced", color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "balance-sheet", type: "Balance Sheet", icon: <BarChart3 className="w-5 h-5" />, description: "Assets, Liabilities, and Equity at a point in time — cumulative across years", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "income-statement", type: "Income Statement", icon: <TrendingUp className="w-5 h-5" />, description: "Revenue and expenses for a specific period — resets each fiscal year", color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "cashflow", type: "Cash Flow", icon: <DollarSign className="w-5 h-5" />, description: "Operating, investing, and financing cash flow summary", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "budget", type: "Budget vs Actual", icon: <TrendingDown className="w-5 h-5" />, description: "Compare planned budgets against actual spend by project", color: "text-red-600", bg: "bg-red-50" },
];

const CASHFLOW_DATA = [
  { label: "Operating Cash Flow", value: "+$1,394,800", positive: true as const },
  { label: "Investing Activities", value: "−$240,000", positive: false as const },
  { label: "Financing Activities", value: "−$120,000", positive: false as const },
  { label: "Net Cash Movement", value: "+$1,034,800", positive: true as const },
  { label: "Opening Balance", value: "$2,800,000" },
  { label: "Closing Balance", value: "$3,834,800", positive: true as const },
];

const BUDGET_DATA = [
  { label: "Lekki Tower A", value: "65% utilised", sub: "$8.1M of $12.5M" },
  { label: "Riverside Residential", value: "42% utilised", sub: "$3.4M of $8.2M" },
  { label: "Mall Renovation", value: "105% OVER BUDGET", sub: "$19.3M of $18.4M", positive: false as const },
  { label: "Industrial Warehouse", value: "15% utilised", sub: "$0.9M of $5.8M" },
  { label: "Airport Road Bridge", value: "45% utilised", sub: "$14.4M of $32M" },
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export function FinanceReportsPage() {
  const { fiscalYears, getTrialBalance, getBalanceSheet, getIncomeStatement } = useFinance();
  const [selectedReport, setSelectedReport] = useState<string>("trial-balance");
  const [selectedFyId, setSelectedFyId] = useState<string>(() => {
    const current = fiscalYears.find(fy => fy.isCurrent);
    return current?.id ?? fiscalYears[0]?.id ?? "";
  });

  const selectedFy = fiscalYears.find(fy => fy.id === selectedFyId);
  const tb = getTrialBalance(selectedFyId);
  const balanceSheet = getBalanceSheet(selectedFyId);
  const incomeStatement = getIncomeStatement(selectedFyId);

  const totalDebits = tb.reduce((s, r) => s + r.debit, 0);
  const totalCredits = tb.reduce((s, r) => s + r.credit, 0);

  const active = templates.find((t) => t.id === selectedReport)!;

  function handleExport() {
    const rows: string[][] = [];
    if (selectedReport === "trial-balance") {
      rows.push(["Account Code", "Account Name", "Type", "Debit", "Credit"]);
      tb.forEach(r => rows.push([r.code, r.accountName, r.type, fmt(r.debit), fmt(r.credit)]));
      rows.push(["", "", "Total", fmt(totalDebits), fmt(totalCredits)]);
    } else if (selectedReport === "balance-sheet") {
      rows.push(["Section", "Account", "Amount"]);
      balanceSheet.forEach(s => {
        rows.push([s.section, "", fmt(s.total)]);
        s.items.forEach(i => rows.push(["", i.account, fmt(i.amount)]));
      });
    } else if (selectedReport === "income-statement") {
      rows.push(["Item", "Amount"]);
      incomeStatement.forEach(r => rows.push([r.label, r.isSection ? "" : fmt(r.amount)]));
    }
    exportCSV(`finance-report-${selectedReport}-${selectedFy?.label ?? "all"}`, rows[0] ?? [], rows.slice(1));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export financial reports — computed from posted transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedFyId} onChange={(e) => setSelectedFyId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {fiscalYears.map(fy => (
              <option key={fy.id} value={fy.id}>{fy.label} ({fy.startDate} — {fy.endDate})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report templates */}
      <div className="grid grid-cols-5 gap-3">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setSelectedReport(t.id)}
            className={`p-4 rounded-xl border text-left transition-all ${selectedReport === t.id ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center mb-3 ${t.color}`}>{t.icon}</div>
            <p className="text-xs font-semibold text-gray-900">{t.type}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Report preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${active.bg} flex items-center justify-center ${active.color}`}>{active.icon}</div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{active.type}</h2>
              <p className="text-xs text-gray-500">Period: {selectedFy?.label ?? "All years"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedReport === "trial-balance" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trial Balance — {selectedFy?.label}</p>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Account Code</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Account Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Debit</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tb.map(r => (
                    <tr key={r.code} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">{r.code}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{r.accountName}</td>
                      <td className="px-6 py-3"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{r.type}</span></td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-gray-900">{r.debit > 0 ? fmt(r.debit) : "—"}</td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-gray-900">{r.credit > 0 ? fmt(r.credit) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-900 text-right">Total</td>
                    <td className="px-6 py-3 text-right text-sm font-mono text-gray-900">{fmt(totalDebits)}</td>
                    <td className="px-6 py-3 text-right text-sm font-mono text-gray-900">{fmt(totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <span className={`text-xs font-semibold ${Math.abs(totalDebits - totalCredits) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
                  {Math.abs(totalDebits - totalCredits) < 0.01 ? "✓ Trial Balance is balanced" : "✗ Trial Balance is NOT balanced"}
                </span>
              </div>
            </div>
          )}

          {selectedReport === "balance-sheet" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance Sheet — {selectedFy?.label}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {balanceSheet.map(section => (
                  <div key={section.section} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{section.section}</h3>
                      <span className="text-sm font-bold text-gray-900">{fmt(section.total)}</span>
                    </div>
                    <div className="space-y-1.5">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm pl-6">
                          <span className="text-gray-600">{item.account}</span>
                          <span className="font-mono text-gray-800">{fmt(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Assets = Liabilities + Equity</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {fmt(balanceSheet[0]?.total ?? 0)} = {fmt((balanceSheet[1]?.total ?? 0) + (balanceSheet[2]?.total ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "income-statement" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Income Statement — {selectedFy?.label}</p>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Item</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {incomeStatement.map((r, i) => (
                    <tr key={i} className={`${r.isTotal ? "bg-gray-50 font-semibold" : r.isSection ? "bg-gray-50/50" : ""}`}>
                      <td className="px-6 py-3 text-sm text-gray-900">{r.label}</td>
                      <td className="px-6 py-3 text-right text-sm font-mono">
                        {r.isSection ? "" : <span className={r.amount >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>{fmt(r.amount)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "cashflow" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-3"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash Flow Statement</p></div>
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Metric</th><th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Value</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {CASHFLOW_DATA.map((r, i) => (
                    <tr key={i} className={i === 0 ? "bg-gray-50" : ""}>
                      <td className="px-6 py-3 text-sm text-gray-900">{r.label}</td>
                      <td className={`px-6 py-3 text-sm font-semibold text-right ${r.positive === true ? "text-emerald-600" : r.positive === false ? "text-red-600" : "text-gray-900"}`}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "budget" && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-3"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget vs Actual</p></div>
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Project</th><th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Utilisation</th><th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {BUDGET_DATA.map((r, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 text-sm text-gray-900">{r.label}</td>
                      <td className={`px-6 py-3 text-sm font-semibold text-right ${r.positive === false ? "text-red-600" : "text-gray-900"}`}>{r.value}</td>
                      <td className="px-6 py-3 text-xs text-gray-400 text-right">{r.sub ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">
              <strong>Generated:</strong> {new Date().toLocaleDateString()} · <strong>Source:</strong> BuildOS Finance Module · <strong>Period:</strong> {selectedFy?.label ?? "All years"} · All figures in NGN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
