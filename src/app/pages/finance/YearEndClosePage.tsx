import { useState } from "react";
import {
  CalendarCheck, CheckCircle, XCircle, AlertTriangle, Lock, Unlock,
  Download, ChevronRight, ChevronDown, FileText, Eye,
} from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import type { FiscalYear } from "./types";

const CLOSE_STEPS = [
  { id: "verify", label: "Verify Transactions", icon: <FileText className="w-4 h-4" /> },
  { id: "trial-balance", label: "Pre-Close Trial Balance", icon: <Eye className="w-4 h-4" /> },
  { id: "closing-entries", label: "Generate Closing Entries", icon: <ChevronDown className="w-4 h-4" /> },
  { id: "lock", label: "Lock Fiscal Year", icon: <Lock className="w-4 h-4" /> },
  { id: "statements", label: "Final Statements", icon: <Download className="w-4 h-4" /> },
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export function YearEndClosePage() {
  const { fiscalYears, setFiscalYears, getTrialBalance, getBalanceSheet, getIncomeStatement, accounts } = useFinance();
  const [selectedFyId, setSelectedFyId] = useState<string>(() => {
    const open = fiscalYears.find(fy => fy.status === "open");
    return open?.id ?? fiscalYears[0]?.id ?? "";
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [closingEntries, setClosingEntries] = useState<{ label: string; dr: string; cr: string; amount: number }[]>([]);
  const [statementsGenerated, setStatementsGenerated] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [locked, setLocked] = useState(false);

  const selectedFy = fiscalYears.find(fy => fy.id === selectedFyId);
  const isClosed = selectedFy?.status === "closed" || locked;

  const tb = getTrialBalance(selectedFyId);
  const balanceSheet = getBalanceSheet(selectedFyId);
  const incomeStatement = getIncomeStatement(selectedFyId);

  const totalDebits = tb.reduce((s, r) => s + r.debit, 0);
  const totalCredits = tb.reduce((s, r) => s + r.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  function generateClosingEntries() {
    const incomeTotal = tb.filter(r => r.type === "Income").reduce((s, r) => s + r.credit - r.debit, 0);
    const expenseTotal = tb.filter(r => r.type === "Expenses").reduce((s, r) => s + r.debit - r.credit, 0);
    const netIncome = incomeTotal - expenseTotal;

    const entries = [
      ...tb.filter(r => r.type === "Income" && (r.credit - r.debit) > 0)
        .map(r => ({ label: `Close ${r.accountName}`, dr: r.accountName, cr: "P&L Summary", amount: r.credit - r.debit })),
      ...tb.filter(r => r.type === "Expenses" && (r.debit - r.credit) > 0)
        .map(r => ({ label: `Close ${r.accountName}`, dr: "P&L Summary", cr: r.accountName, amount: r.debit - r.credit })),
    ];

    if (netIncome > 0) {
      entries.push({ label: "Transfer Net Income to Retained Earnings", dr: "P&L Summary", cr: "Retained Earnings", amount: netIncome });
    } else if (netIncome < 0) {
      entries.push({ label: "Transfer Net Loss to Retained Earnings", dr: "Retained Earnings", cr: "P&L Summary", amount: Math.abs(netIncome) });
    }

    setClosingEntries(entries);
  }

  function handleLockYear() {
    if (!selectedFy) return;
    setFiscalYears(prev => prev.map(fy =>
      fy.id === selectedFyId
        ? { ...fy, status: "closed" as const, closedAt: new Date().toISOString().split("T")[0], closedBy: "Sola Adeleke" }
        : fy
    ));
    setLocked(true);
    setShowConfirmLock(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Year-End Close</h1>
          <p className="text-sm text-gray-500 mt-0.5">Close a fiscal year — generate closing entries, lock the period, and produce final statements</p>
        </div>
      </div>

      {/* Fiscal Year Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Select Fiscal Year:</label>
          <select value={selectedFyId} onChange={e => { setSelectedFyId(e.target.value); setCurrentStep(0); setLocked(false); setStatementsGenerated(false); setClosingEntries([]); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {fiscalYears.map(fy => (
              <option key={fy.id} value={fy.id}>
                {fy.label} ({fy.startDate} — {fy.endDate}) · {fy.status.toUpperCase()}
              </option>
            ))}
          </select>
          {isClosed && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
              <Lock className="w-3.5 h-3.5" /> Closed on {selectedFy?.closedAt}
            </span>
          )}
        </div>
      </div>

      {!isClosed ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Sidebar */}
          <div className="space-y-2">
            {CLOSE_STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  currentStep === i
                    ? "border-emerald-300 bg-emerald-50"
                    : currentStep > i
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep > i ? "bg-green-500 text-white" : currentStep === i ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {currentStep > i ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-400">{stepDescriptions[i]}</p>
                </div>
                {currentStep > i && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 1: Verify Transactions</h3>
                <p className="text-sm text-gray-500">Ensure all transactions for {selectedFy?.label} have been submitted and approved before closing.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500">All Ledger Entries</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{tb.length} entries</p>
                  </div>
                  <div className={isBalanced ? "bg-green-50 border border-green-200 rounded-xl p-4" : "bg-red-50 border border-red-200 rounded-xl p-4"}>
                    <p className="text-xs text-gray-500">Trial Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${isBalanced ? "text-green-700" : "text-red-700"}`}>
                      {isBalanced ? "Balanced ✓" : "Unbalanced ✗"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Continue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 2: Pre-Close Trial Balance</h3>
                <p className="text-sm text-gray-500">Review the trial balance before closing. Debits must equal credits.</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Code</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Type</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Debit</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tb.map(r => (
                        <tr key={r.code} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{r.accountName}</td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-500">{r.code}</td>
                          <td className="px-4 py-2"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{r.type}</span></td>
                          <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{r.debit > 0 ? fmt(r.debit) : "—"}</td>
                          <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{r.credit > 0 ? fmt(r.credit) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-900 text-right">Total</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{fmt(totalDebits)}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">{fmt(totalCredits)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Generate Closing Entries <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 3: Closing Entries</h3>
                <p className="text-sm text-gray-500">Close income and expense accounts to P&L Summary, then transfer to Retained Earnings.</p>
                {closingEntries.length === 0 ? (
                  <button onClick={generateClosingEntries} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Generate Closing Entries
                  </button>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Debit</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Credit</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {closingEntries.map((e, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{e.label}</td>
                            <td className="px-4 py-2 text-sm font-mono text-gray-700">{e.dr}</td>
                            <td className="px-4 py-2 text-sm font-mono text-gray-700">{e.cr}</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => setCurrentStep(3)} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Lock Fiscal Year <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 4: Lock Fiscal Year</h3>
                <p className="text-sm text-gray-500">Once locked, no new transactions can be posted to {selectedFy?.label}. This action is irreversible.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Irreversible Action</p>
                      <p className="text-xs text-amber-700 mt-0.5">Locking the fiscal year will prevent any new postings, edits, or reversals for this period. Ensure all entries are complete before proceeding.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setShowConfirmLock(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                    <Lock className="w-3.5 h-3.5" /> Lock {selectedFy?.label}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 5: Final Financial Statements</h3>
                <p className="text-sm text-gray-500">The final Income Statement and Balance Sheet for {selectedFy?.label}.</p>
                {!statementsGenerated ? (
                  <button onClick={() => { setStatementsGenerated(true); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Generate Final Statements
                  </button>
                ) : (
                  <div className="space-y-6">
                    {/* Income Statement */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Income Statement — {selectedFy?.label}</h4>
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-50">
                          {incomeStatement.map((r, i) => (
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

                    {/* Balance Sheet */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Balance Sheet — {selectedFy?.label}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {balanceSheet.map(section => (
                          <div key={section.section} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-semibold text-gray-900">{section.section}</h5>
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
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900">Fiscal Year Closed</h2>
          <p className="text-sm text-gray-500 mt-1">{selectedFy?.label} was closed on {selectedFy?.closedAt} by {selectedFy?.closedBy}.</p>
          <p className="text-sm text-gray-400 mt-0.5">No further transactions can be posted to this period.</p>
        </div>
      )}

      {/* Confirm Lock Modal */}
      {showConfirmLock && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Lock {selectedFy?.label}?</h3>
            <p className="text-sm text-gray-500 mb-5">This will prevent any new transactions for this fiscal year. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmLock(false)} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleLockYear} className="flex-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Lock Year</button>
            </div>
          </div>
        </div>
      )}

      {/* Success - move to step 5 */}
      {locked && currentStep < 4 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{selectedFy?.label} Locked</h3>
            <p className="text-sm text-gray-500 mb-5">The fiscal year has been closed. Proceed to generate final statements.</p>
            <button onClick={() => { setCurrentStep(4); }} className="w-full px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Generate Final Statements
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const stepDescriptions = [
  "Ensure all entries are posted",
  "Verify debits equal credits",
  "Close P&L accounts",
  "Prevent further postings",
  "Download final reports",
];
