import { useState } from "react";
import { RefreshCw, Plus, X, Save, Lock, CheckCircle, AlertTriangle, Calendar, FileText, Eye, XCircle } from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import { useChangelog } from "../../stores/changelogStore";
import type { FiscalYear, FiscalYearStatus } from "./types";

const FISCAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const FISCAL_STATUS_STYLES: Record<FiscalYearStatus, string> = {
  open: "bg-emerald-100 text-emerald-700",
  closing: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-600",
};

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export function FiscalYearsPage() {
  const { fiscalYears, setFiscalYears, getTrialBalance, getBalanceSheet, getIncomeStatement } = useFinance();
  const { logChange } = useChangelog();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ label: "", startDate: "", endDate: "" });
  const [reportFyId, setReportFyId] = useState<string | null>(null);

  const currentFy = fiscalYears.find(fy => fy.isCurrent);

  function handleCreate() {
    if (!form.label || !form.startDate || !form.endDate) return;
    const fy: FiscalYear = {
      id: `fy-${Date.now()}`,
      label: form.label,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "open",
      isCurrent: fiscalYears.length === 0,
    };
    setFiscalYears(prev => [...prev, fy]);
    logChange({ module: "Finance", action: "Created", entityType: "FiscalYear", entityId: fy.id, summary: `Fiscal year ${fy.label} created`, performedBy: "Sola Adeleke" });
    setShowModal(false);
    setForm({ label: "", startDate: "", endDate: "" });
  }

  function handleSetCurrent(id: string) {
    const target = fiscalYears.find(fy => fy.id === id);
    setFiscalYears(prev => prev.map(fy => ({ ...fy, isCurrent: fy.id === id })));
    if (target) logChange({ module: "Finance", action: "Set as Current", entityType: "FiscalYear", entityId: id, summary: `Fiscal year ${target.label} set as current`, performedBy: "Sola Adeleke" });
  }

  function handleClose(id: string) {
    const target = fiscalYears.find(fy => fy.id === id);
    setFiscalYears(prev => prev.map(fy =>
      fy.id === id ? { ...fy, status: "closed", closedAt: new Date().toISOString().split("T")[0], closedBy: "Sola Adeleke" } : fy
    ));
    if (target) logChange({ module: "Finance", action: "Closed", entityType: "FiscalYear", entityId: id, summary: `Fiscal year ${target.label} closed`, performedBy: "Sola Adeleke" });
  }

  function handleReopen(id: string) {
    const target = fiscalYears.find(fy => fy.id === id);
    setFiscalYears(prev => prev.map(fy =>
      fy.id === id ? { ...fy, status: "open", closedAt: undefined, closedBy: undefined } : fy
    ));
    if (target) logChange({ module: "Finance", action: "Reopened", entityType: "FiscalYear", entityId: id, summary: `Fiscal year ${target.label} reopened`, performedBy: "Sola Adeleke" });
  }

  const reportFy = reportFyId ? fiscalYears.find(fy => fy.id === reportFyId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fiscal Years</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage fiscal year definitions, set the active year, and view period-end close history</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> New Fiscal Year
        </button>
      </div>

      {currentFy && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-800">
              <strong>Current Active Year:</strong> {currentFy.label} ({currentFy.startDate} — {currentFy.endDate})
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fiscalYears.map(fy => {
          const totalDays = Math.round((new Date(fy.endDate).getTime() - new Date(fy.startDate).getTime()) / 86400000) + 1;
          const elapsedDays = fy.status !== "open" ? totalDays : Math.max(0, Math.round((Date.now() - new Date(fy.startDate).getTime()) / 86400000));
          const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

          return (
            <div key={fy.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">{fy.label}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${FISCAL_STATUS_STYLES[fy.status]}`}>
                      {fy.status.charAt(0).toUpperCase() + fy.status.slice(1)}
                    </span>
                    {fy.isCurrent && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fy.status === "open" && !fy.isCurrent && (
                      <button onClick={() => handleSetCurrent(fy.id)} className="px-3 py-1.5 text-xs text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50">Set as Current</button>
                    )}
                    {fy.status === "open" && (
                      <button onClick={() => handleClose(fy.id)} className="px-3 py-1.5 text-xs text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50"><Lock className="w-3 h-3 inline mr-1" />Close</button>
                    )}
                    {fy.status === "closed" && (
                      <>
                        <button onClick={() => setReportFyId(fy.id)} className="px-3 py-1.5 text-xs text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"><FileText className="w-3 h-3 inline mr-1" />View Reports</button>
                        <button onClick={() => handleReopen(fy.id)} className="px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">Reopen</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-900">{fy.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="font-medium text-gray-900">{fy.endDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{totalDays} days</p>
                  </div>
                  {fy.closedAt && (
                    <div>
                      <p className="text-xs text-gray-500">Closed</p>
                      <p className="font-medium text-gray-900">{fy.closedAt} by {fy.closedBy}</p>
                    </div>
                  )}
                </div>

                {/* Progress bar for open years */}
                {fy.status === "open" && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Year Progress</span><span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Modal */}
      {reportFy && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-900">Financial Reports — {reportFy.label}</h2>
              </div>
              <button onClick={() => setReportFyId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-6">
              {(() => {
                const tb = getTrialBalance(reportFy.id);
                const bs = getBalanceSheet(reportFy.id);
                const is = getIncomeStatement(reportFy.id);
                return (
                  <>
                    {/* Trial Balance */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Trial Balance</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Code</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Debit</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {tb.map(r => (
                              <tr key={r.code} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{r.accountName}</td>
                                <td className="px-4 py-2 text-xs font-mono text-gray-500">{r.code}</td>
                                <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{r.debit > 0 ? fmt(r.debit) : "—"}</td>
                                <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{r.credit > 0 ? fmt(r.credit) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Income Statement */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Income Statement</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-50">
                            {is.map((r, i) => (
                              <tr key={i} className={r.isTotal ? "bg-gray-50 font-semibold" : r.isSection ? "bg-gray-50/50" : ""}>
                                <td className="px-4 py-2 text-sm text-gray-900">{r.label}</td>
                                <td className="px-4 py-2 text-right text-sm font-mono">
                                  {r.isSection ? "" : <span className={r.amount >= 0 ? "text-emerald-600" : "text-red-600"}>{fmt(r.amount)}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Balance Sheet */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Balance Sheet</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="divide-y divide-gray-100">
                          {bs.map(section => (
                            <div key={section.section} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">{section.section}</h4>
                                <span className="text-sm font-bold text-gray-900">{fmt(section.total)}</span>
                              </div>
                              <div className="space-y-1">
                                {section.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm pl-4">
                                    <span className="text-gray-600">{item.account}</span>
                                    <span className="font-mono text-gray-800">{fmt(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setReportFyId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">New Fiscal Year</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Label *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. FY 2027" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Save className="w-3.5 h-3.5" /> Create Fiscal Year
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
