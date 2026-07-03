import { useState } from "react";
import {
  ScrollText, Plus, Search, X, Save, ArrowLeftRight, CheckCircle, XCircle, Clock, RefreshCw,
} from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import { exportCSV } from "../../utils/exportCSV";
import type {
  Accrual, AccrualType, AccrualStatus,
} from "./types";
import {
  ACCRUAL_STATUS_LABELS, ACCRUAL_STATUS_COLORS,
} from "./types";

const ACCRUAL_STATUSES: AccrualStatus[] = [
  "active", "partially-reversed", "fully-reversed", "cancelled",
];

const SOURCE_MODULES = ["Procurement", "HR", "Finance", "Projects", "ESS", "Storefront"];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

const emptyForm = {
  type: "",
  title: "", description: "", amount: "",
  debitAccount: "", creditAccount: "",
  reversalDate: "", reference: "", sourceModule: "Procurement" as string,
};

export function AccrualsPage() {
  const { accruals, setAccruals, fiscalYears, accounts, accrualTypeConfigs } = useFinance();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccrualType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<AccrualStatus | "All">("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const currentFy = fiscalYears.find(fy => fy.isCurrent);

  const filtered = accruals.filter(a => {
    if (typeFilter !== "All" && a.type !== typeFilter) return false;
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    if (search && ![a.title, a.description, a.reference, a.sourceRef, a.sourceModule]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  function handleCreate() {
    if (!form.title.trim() || !form.amount || !form.reversalDate || !form.debitAccount || !form.creditAccount || !form.type) return;
    const accrual: Accrual = {
      id: `acc-${Date.now()}`,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      debitAccount: form.debitAccount,
      creditAccount: form.creditAccount,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "Sola Adeleke",
      reversalDate: form.reversalDate,
      reference: form.reference.trim() || `ACCR-${Date.now()}`,
      sourceModule: form.sourceModule,
      sourceRef: form.reference.trim() || `ACCR-${Date.now()}`,
      fiscalYearId: currentFy?.id ?? "fy2",
    };
    setAccruals(prev => [accrual, ...prev]);
    setShowModal(false);
    setForm(emptyForm);
  }

  function handleReverse(id: string) {
    setAccruals(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: "fully-reversed" as AccrualStatus, reversedAt: new Date().toISOString().split("T")[0], reversedAmount: a.amount }
        : a
    ));
  }

  function handleCancel(id: string) {
    setAccruals(prev => prev.map(a =>
      a.id === id ? { ...a, status: "cancelled" as AccrualStatus } : a
    ));
  }

  function handleExport() {
    exportCSV("accruals",
      ["ID", "Type", "Title", "Amount", "Status", "Created", "Reversal Date", "Source", "Reference"],
      filtered.map(a => [a.id, accrualTypeConfigs.find(tc => tc.type === a.type)?.label ?? a.type, a.title, fmt(a.amount), ACCRUAL_STATUS_LABELS[a.status], a.createdAt, a.reversalDate, a.sourceModule, a.reference]),
    );
  }

  const activeTotal = accruals.filter(a => a.status === "active").reduce((s, a) => s + a.amount, 0);
  const reversedTotal = accruals.filter(a => a.status === "fully-reversed").reduce((s, a) => s + (a.reversedAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Accruals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage accrual entries across all modules — GRNI, prepaids, deferrals, and more</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Export CSV</button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> New Accrual
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Accruals", value: accruals.length, color: "text-gray-900", bg: "bg-white" },
          { label: "Active (Pending Reversal)", value: fmt(activeTotal), color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Reversed This Period", value: fmt(reversedTotal), color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Net Accrual Exposure", value: fmt(activeTotal - reversedTotal), color: "text-amber-700", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accruals..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button key="All" onClick={() => setTypeFilter("All")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${typeFilter === "All" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>All Types</button>
          {accrualTypeConfigs.map(tc => (
            <button key={tc.type} onClick={() => setTypeFilter(tc.type as AccrualType)} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${typeFilter === tc.type ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {tc.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["All", ...ACCRUAL_STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {s === "All" ? "All Status" : ACCRUAL_STATUS_LABELS[s as AccrualStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Accruals Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accrual Register</span>
          <span className="text-xs text-gray-400">{filtered.length} entries</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">DR / CR</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Source</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Reversal Date</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${accrualTypeConfigs.find(tc => tc.type === a.type)?.color ?? "bg-gray-100 text-gray-600"}`}>{accrualTypeConfigs.find(tc => tc.type === a.type)?.label ?? a.type}</span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs font-mono text-gray-600">{a.debitAccount}</p>
                  <p className="text-xs font-mono text-gray-400">{a.creditAccount}</p>
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{fmt(a.amount)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ACCRUAL_STATUS_COLORS[a.status]}`}>
                    {ACCRUAL_STATUS_LABELS[a.status]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.sourceModule}</span>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{a.reference}</p>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{a.reversalDate}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {a.status === "active" && (
                      <>
                        <button onClick={() => handleReverse(a.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Reverse Accrual">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCancel(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Accrual">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {a.status === "fully-reversed" && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" /> Reversed</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No accruals found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">New Accrual Entry</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Accrual Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as AccrualType })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select accrual type...</option>
                    {accrualTypeConfigs.map(tc => <option key={tc.type} value={tc.type}>{tc.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (₦) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 1000000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. GRNI — Supplier Name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe the accrual reason" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Debit Account *</label>
                  <select value={form.debitAccount} onChange={e => setForm({ ...form, debitAccount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select debit account...</option>
                    {accounts.filter(a => a.parentId !== null).map(a => (
                      <option key={a.id} value={`${a.code} ${a.name}`}>{a.code} — {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Credit Account *</label>
                  <select value={form.creditAccount} onChange={e => setForm({ ...form, creditAccount: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select credit account...</option>
                    {accounts.filter(a => a.parentId !== null).map(a => (
                      <option key={a.id} value={`${a.code} ${a.name}`}>{a.code} — {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reversal Date *</label>
                  <input type="date" value={form.reversalDate} onChange={e => setForm({ ...form, reversalDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source Module</label>
                  <select value={form.sourceModule} onChange={e => setForm({ ...form, sourceModule: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {SOURCE_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference</label>
                <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="e.g. PO-0031" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-400 mt-1">Reference to the source document (PO, GRN, PR, etc.)</p>
              </div>
              {currentFy && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                  This accrual will be recorded under <strong>{currentFy.label}</strong>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Save className="w-3.5 h-3.5" /> Create Accrual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
