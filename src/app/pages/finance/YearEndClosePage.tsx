import { useState } from "react";
import {
  CalendarCheck, CheckCircle, XCircle, AlertTriangle, Lock,
  ChevronRight, FileText, Eye, Database, LogOut,
} from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import { useChangelog } from "../../stores/changelogStore";
import type { FiscalYear } from "./types";

const CLOSE_STEPS = [
  { id: "verify", label: "Verify Transactions", icon: <FileText className="w-4 h-4" />, desc: "Ensure all ledger entries are complete and the trial balance is balanced before proceeding." },
  { id: "appropriation", label: "Select Appropriation Account", icon: <Database className="w-4 h-4" />, desc: "Choose the retained earnings or appropriation account where net income/loss will be transferred." },
  { id: "zeroize", label: "Zeroize Income Statement Accounts", icon: <LogOut className="w-4 h-4" />, desc: "Close all revenue and expense accounts to zero, transferring balances to the appropriation account." },
  { id: "lock", label: "Close Account for Fiscal Year", icon: <Lock className="w-4 h-4" />, desc: "Once closed, the account will be locked. No further postings, edits, or reversals will be permitted for this period." },
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export function YearEndClosePage() {
  const { fiscalYears, setFiscalYears, getTrialBalance, getBalanceSheet, getIncomeStatement, accounts } = useFinance();
  const { logChange } = useChangelog();
  const [selectedFyId, setSelectedFyId] = useState<string>(() => {
    const open = fiscalYears.find(fy => fy.status === "open");
    return open?.id ?? fiscalYears[0]?.id ?? "";
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [closingEntries, setClosingEntries] = useState<{ label: string; dr: string; cr: string; amount: number }[]>([]);
  const [statementsGenerated, setStatementsGenerated] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [locked, setLocked] = useState(false);
  const [appropriationAccount, setAppropriationAccount] = useState("3100 Retained Earnings");

  const selectedFy = fiscalYears.find(fy => fy.id === selectedFyId);
  const isClosed = selectedFy?.status === "closed" || locked;

  const tb = getTrialBalance(selectedFyId);
  const balanceSheet = getBalanceSheet(selectedFyId);
  const incomeStatement = getIncomeStatement(selectedFyId);

  const totalDebits = tb.reduce((s, r) => s + r.debit, 0);
  const totalCredits = tb.reduce((s, r) => s + r.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const equityAccounts = accounts.filter(a => a.type === "Equity" && a.parentId !== null)
    .map(a => `${a.code} ${a.name}`);

  function generateClosingEntries() {
    const incomeTotal = tb.filter(r => r.type === "Income").reduce((s, r) => s + r.credit - r.debit, 0);
    const expenseTotal = tb.filter(r => r.type === "Expenses").reduce((s, r) => s + r.debit - r.credit, 0);
    const netIncome = incomeTotal - expenseTotal;

    const entries = [
      ...tb.filter(r => r.type === "Income" && (r.credit - r.debit) > 0)
        .map(r => ({ label: `Close ${r.accountName}`, dr: r.accountName, cr: appropriationAccount, amount: r.credit - r.debit })),
      ...tb.filter(r => r.type === "Expenses" && (r.debit - r.credit) > 0)
        .map(r => ({ label: `Close ${r.accountName}`, dr: appropriationAccount, cr: r.accountName, amount: r.debit - r.credit })),
    ];

    if (netIncome > 0) {
      entries.push({ label: "Transfer Net Income to Appropriation Account", dr: "P&L Summary", cr: appropriationAccount, amount: netIncome });
    } else if (netIncome < 0) {
      entries.push({ label: "Transfer Net Loss to Appropriation Account", dr: appropriationAccount, cr: "P&L Summary", amount: Math.abs(netIncome) });
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
    logChange({ module: "Finance", action: "Closed Fiscal Year", entityType: "FiscalYear", entityId: selectedFyId, summary: `Fiscal year ${selectedFy.label} closed`, performedBy: "Sola Adeleke" });
    setLocked(true);
    setShowConfirmLock(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Year-End Close</h1>
          <p className="text-sm text-gray-500 mt-0.5">Close a fiscal year — verify transactions, select appropriation account, zeroise income statements, and lock the period.</p>
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{step.desc}</p>
                </div>
                {currentStep > i && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 1: Verify Transactions</h3>
                <p className="text-sm text-gray-500">Ensure all transactions for {selectedFy?.label} have been submitted and approved before closing. The trial balance must be balanced to proceed.</p>
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
                <h3 className="text-sm font-semibold text-gray-900">Step 2: Select Appropriation Account</h3>
                <p className="text-sm text-gray-500">Choose the equity account where net income or loss will be transferred during the closing process.</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Appropriation / Retained Earnings Account</label>
                  <select value={appropriationAccount} onChange={e => setAppropriationAccount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {equityAccounts.length === 0 && <option value="3100 Retained Earnings">3100 Retained Earnings</option>}
                    {equityAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <p>This account will receive the net income or loss for <strong>{selectedFy?.label}</strong>. Income statement accounts will be zeroized against this account.</p>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => { setCurrentStep(2); generateClosingEntries(); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Generate Closing Entries <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Step 3: Zeroize Income Statement Accounts</h3>
                <p className="text-sm text-gray-500">Close all income and expense accounts to zero. Balances are transferred to {appropriationAccount}.</p>
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
                <h3 className="text-sm font-semibold text-gray-900">Step 4: Close Account for Fiscal Year</h3>
                <p className="text-sm text-gray-500">Once closed, the account will be locked. No further postings, edits, or reversals will be permitted for this period.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Irreversible Action</p>
                      <p className="text-xs text-amber-700 mt-0.5">Locking the fiscal year will prevent any new postings, edits, or reversals for this period. Ensure all entries are complete before proceeding.</p>
                    </div>
                  </div>
                </div>

                {/* Summary before closing */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">Closing Summary — {selectedFy?.label}</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Appropriation Account</span>
                      <span className="font-semibold text-gray-900">{appropriationAccount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Income Statement Accounts to Zeroize</span>
                      <span className="font-semibold text-gray-900">{closingEntries.length} entries</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Trial Balance</span>
                      <span className={`font-semibold ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>{isBalanced ? "Balanced" : "Unbalanced"}</span>
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
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900">Fiscal Year Closed</h2>
          <p className="text-sm text-gray-500 mt-1">{selectedFy?.label} was closed on {selectedFy?.closedAt} by {selectedFy?.closedBy}.</p>
          <p className="text-sm text-gray-400 mt-0.5">No further transactions can be posted to this period.</p>

          {/* Final Statements */}
          <div className="mt-6 max-w-2xl mx-auto text-left space-y-4">
            <button onClick={() => setStatementsGenerated(!statementsGenerated)} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium mx-auto">
              <FileText className="w-4 h-4" /> {statementsGenerated ? "Hide" : "View"} Final Statements
            </button>
            {statementsGenerated && (
              <div className="space-y-4">
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
            <p className="text-sm text-gray-500 mb-5">Once closed, the account will be locked. No further postings, edits, or reversals will be permitted for this period.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmLock(false)} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleLockYear} className="flex-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Lock Year</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
