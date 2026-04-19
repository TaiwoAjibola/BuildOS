import { useState } from "react";
import { BarChart3, Download, FileText, TrendingUp, TrendingDown, DollarSign, Users, Eye } from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type ReportType = "Expense Report" | "Income Report" | "Cash Flow" | "Budget vs Actual" | "Payroll Summary";

interface ReportTemplate {
  id: string;
  type: ReportType;
  icon: React.ReactNode;
  description: string;
  color: string;
  bg: string;
}

interface ReportRow {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}

const PERIOD_OPTS = ["April 2026", "March 2026", "Q1 2026", "Q2 2026", "FY2026"];

const templates: ReportTemplate[] = [
  { id: "expense", type: "Expense Report", icon: <TrendingDown className="w-5 h-5" />, description: "Breakdown of all expenses by project, category, and period", color: "text-red-600", bg: "bg-red-50" },
  { id: "income", type: "Income Report", icon: <TrendingUp className="w-5 h-5" />, description: "Summary of all income sources and amounts received", color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "cashflow", type: "Cash Flow", icon: <DollarSign className="w-5 h-5" />, description: "Operating, investing, and financing cash flow summary", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "budget", type: "Budget vs Actual", icon: <BarChart3 className="w-5 h-5" />, description: "Compare planned budgets against actual spend by project", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "payroll", type: "Payroll Summary", icon: <Users className="w-5 h-5" />, description: "Payroll totals by department and period", color: "text-purple-600", bg: "bg-purple-50" },
];

const reportData: Record<string, ReportRow[]> = {
  expense: [
    { label: "Total Expenses", value: "$2,845,200", positive: false },
    { label: "Materials", value: "$882,000", sub: "31% of total" },
    { label: "Labour Costs", value: "$740,000", sub: "26% of total" },
    { label: "Equipment Hire", value: "$520,000", sub: "18% of total" },
    { label: "Subcontractors", value: "$420,000", sub: "15% of total" },
    { label: "Overheads", value: "$283,200", sub: "10% of total" },
  ],
  income: [
    { label: "Total Income", value: "$4,240,000", positive: true },
    { label: "Contract Revenue", value: "$3,740,000", sub: "88% of total" },
    { label: "Service Income", value: "$320,000", sub: "8% of total" },
    { label: "Government Grants", value: "$180,000", sub: "4% of total" },
  ],
  cashflow: [
    { label: "Operating Cash Flow", value: "+$1,394,800", positive: true },
    { label: "Investing Activities", value: "−$240,000", positive: false },
    { label: "Financing Activities", value: "−$120,000", positive: false },
    { label: "Net Cash Movement", value: "+$1,034,800", positive: true },
    { label: "Opening Balance", value: "$2,800,000" },
    { label: "Closing Balance", value: "$3,834,800", positive: true },
  ],
  budget: [
    { label: "Lekki Tower A", value: "65% utilised", sub: "$8.1M of $12.5M" },
    { label: "Riverside Residential", value: "42% utilised", sub: "$3.4M of $8.2M" },
    { label: "Mall Renovation", value: "105% OVER BUDGET", sub: "$19.3M of $18.4M", positive: false },
    { label: "Industrial Warehouse", value: "15% utilised", sub: "$0.9M of $5.8M" },
    { label: "Airport Road Bridge", value: "45% utilised", sub: "$14.4M of $32M" },
  ],
  payroll: [
    { label: "Total Net Payroll", value: "$4,850,000" },
    { label: "Construction", value: "$1,860,000", sub: "48 employees" },
    { label: "Finance & Admin", value: "$980,000", sub: "24 employees" },
    { label: "HR & People", value: "$620,000", sub: "16 employees" },
    { label: "Procurement", value: "$740,000", sub: "19 employees" },
    { label: "Engineering", value: "$650,000", sub: "18 employees" },
    { label: "IT & Systems", value: "$0", sub: "Outsourced" },
  ],
};

export function FinanceReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>("expense");
  const [period, setPeriod] = useState("April 2026");

  const active = templates.find((t) => t.id === selectedReport)!;
  const rows = reportData[selectedReport] ?? [];

  function handleExport() {
    exportCSV(`finance-report-${selectedReport}-${period.replace(" ", "-")}`,
      ["Metric", "Value", "Note"],
      rows.map((r) => [r.label, r.value, r.sub ?? ""]));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {PERIOD_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setSelectedReport(t.id)}
            className={`p-4 rounded-xl border text-left transition-all ${selectedReport === t.id ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center mb-3 ${t.color}`}>
              {t.icon}
            </div>
            <p className="text-xs font-semibold text-gray-900">{t.type}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Report preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${active.bg} flex items-center justify-center ${active.color}`}>
              {active.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{active.type}</h2>
              <p className="text-xs text-gray-500">Period: {period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{active.type} — {period}</p>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Metric</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Value</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={i} className={`${i === 0 ? "bg-gray-50 font-semibold" : ""} hover:bg-gray-50 transition-colors`}>
                    <td className="px-6 py-3 text-sm text-gray-900">{r.label}</td>
                    <td className={`px-6 py-3 text-sm font-semibold text-right ${r.positive === true ? "text-emerald-600" : r.positive === false ? "text-red-600" : "text-gray-900"}`}>{r.value}</td>
                    <td className="px-6 py-3 text-xs text-gray-400 text-right">{r.sub ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">
              <strong>Generated:</strong> Apr 13, 2026 · <strong>Source:</strong> BuildOS Finance Module · <strong>Period:</strong> {period} · All figures in USD unless otherwise stated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
