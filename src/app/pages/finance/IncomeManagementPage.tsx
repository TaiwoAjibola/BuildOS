import { useState } from "react";
import { Plus, Search, Download, TrendingUp, CheckCircle, Clock, ChevronDown, ChevronUp, X, Save } from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type IncomeStatus = "Draft" | "Confirmed" | "Invoiced" | "Received";

interface Income {
  id: string;
  source: string;
  project: string;
  amount: number;
  description: string;
  date: string;
  status: IncomeStatus;
  receivedBy?: string;
}

const statusConfig: Record<IncomeStatus, { badge: string }> = {
  Draft:     { badge: "bg-gray-100 text-gray-600" },
  Confirmed: { badge: "bg-blue-100 text-blue-700" },
  Invoiced:  { badge: "bg-amber-100 text-amber-700" },
  Received:  { badge: "bg-emerald-100 text-emerald-700" },
};

const SOURCES = ["Client Payment", "Contract Milestone", "Subcontractor Recovery", "Insurance Claim", "Government Grant", "Other"];
const PROJECTS = ["Lekki Tower A", "Riverside Residential", "Mall Renovation", "Industrial Warehouse", "Airport Road Bridge"];
const STATUS_OPTS: Array<IncomeStatus | "All"> = ["All", "Draft", "Confirmed", "Invoiced", "Received"];

const mockIncome: Income[] = [
  { id: "INC-0021", source: "Contract Milestone", project: "Lekki Tower A", amount: 1250000, description: "Phase 2 completion milestone — floors 10–18", date: "Apr 12, 2026", status: "Received" },
  { id: "INC-0020", source: "Client Payment", project: "Mall Renovation", amount: 850000, description: "Monthly progress payment — April", date: "Apr 10, 2026", status: "Received" },
  { id: "INC-0019", source: "Contract Milestone", project: "Riverside Residential", amount: 640000, description: "Phase 1A handover — blocks A & B", date: "Apr 8, 2026", status: "Invoiced" },
  { id: "INC-0018", source: "Subcontractor Recovery", project: "Industrial Warehouse", amount: 42000, description: "Back-charge for defective work — MEP contractor", date: "Apr 7, 2026", status: "Confirmed" },
  { id: "INC-0017", source: "Insurance Claim", project: "Airport Road Bridge", amount: 380000, description: "Equipment damage claim — flood incident", date: "Apr 5, 2026", status: "Confirmed" },
  { id: "INC-0016", source: "Contract Milestone", project: "Lekki Tower A", amount: 975000, description: "Phase 1 final milestone — structural complete", date: "Apr 3, 2026", status: "Received" },
  { id: "INC-0015", source: "Government Grant", project: "Airport Road Bridge", amount: 2000000, description: "Federal infrastructure development grant — Q2 disbursement", date: "Apr 1, 2026", status: "Received" },
  { id: "INC-0014", source: "Client Payment", project: "Mall Renovation", amount: 420000, description: "Advance payment — fitout phase", date: "Mar 28, 2026", status: "Draft" },
];

const emptyForm = { source: "", project: "", amount: "", description: "", date: "" };

export function IncomeManagementPage() {
  const [incomes, setIncomes] = useState<Income[]>(mockIncome);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncomeStatus | "All">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const filtered = incomes
    .filter((i) => {
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (search && !i.id.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase()) && !i.source.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => sortDir === "desc" ? b.amount - a.amount : a.amount - b.amount);

  function addIncome() {
    if (!form.source || !form.amount || !form.description || !form.date) return;
    const newInc: Income = {
      id: `INC-${String(incomes.length + 22).padStart(4, "0")}`,
      source: form.source,
      project: form.project || "General",
      amount: parseFloat(form.amount.replace(/,/g, "")),
      description: form.description,
      date: form.date,
      status: "Draft",
    };
    setIncomes([newInc, ...incomes]);
    setShowAddModal(false);
    setForm(emptyForm);
  }

  function advance(id: string) {
    setIncomes((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const next: IncomeStatus = i.status === "Draft" ? "Confirmed" : i.status === "Confirmed" ? "Invoiced" : i.status === "Invoiced" ? "Received" : i.status;
      return { ...i, status: next };
    }));
  }

  function handleExport() {
    exportCSV("income", ["Income ID", "Source", "Project", "Amount", "Date", "Status"],
      incomes.map((i) => [i.id, i.source, i.project, fmt(i.amount), i.date, i.status]));
  }

  const totalReceived = incomes.filter((i) => i.status === "Received").reduce((s, i) => s + i.amount, 0);
  const totalPending = incomes.filter((i) => i.status !== "Received").reduce((s, i) => s + i.amount, 0);
  const total = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Income Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all income sources</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Total Income</p>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{incomes.length} transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Received</p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalReceived)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{incomes.filter((i) => i.status === "Received").length} confirmed payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">In Pipeline</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{fmt(totalPending)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Awaiting receipt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search income..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Income ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Source</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Project</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Description</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}>
                <span className="flex items-center gap-1">Amount {sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-xs font-mono text-gray-500">{i.id}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{i.source}</span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-700">{i.project}</td>
                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{i.description}</td>
                <td className="px-5 py-3 text-sm font-semibold text-emerald-700">{fmt(i.amount)}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{i.date}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[i.status].badge}`}>{i.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  {i.status !== "Received" && (
                    <button onClick={() => advance(i.id)} className="text-xs text-emerald-600 hover:underline">
                      {i.status === "Draft" ? "Confirm →" : i.status === "Confirmed" ? "Invoice →" : "Mark Received →"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No income records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Record Income</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source *</label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select source</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Project</label>
                <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select project</option>
                  {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (USD) *</label>
                  <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 500000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe this income..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addIncome} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
