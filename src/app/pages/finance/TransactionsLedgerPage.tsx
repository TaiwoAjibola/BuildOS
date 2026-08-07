import { useState } from "react";
import {
  Search, Download, ChevronDown, ChevronUp, X,
  ExternalLink, CheckCircle, Clock,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { DataTable, type Column } from "../../components/DataTable";
import { useFinance, type Transaction, type LedgerLine } from "../../stores/financeStore";

function txnLines(txn: Transaction): LedgerLine[] {
  if (txn.lines && txn.lines.length > 0) return txn.lines;
  if (txn.debitAccount && txn.creditAccount) {
    return [
      { id: `${txn.id}-d`, account: txn.debitAccount, debit: Math.abs(txn.amount), credit: 0, description: "" },
      { id: `${txn.id}-c`, account: txn.creditAccount, debit: 0, credit: Math.abs(txn.amount), description: "" },
    ];
  }
  return [];
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  Income: "bg-emerald-100 text-emerald-700", Expense: "bg-red-100 text-red-700",
  Payroll: "bg-purple-100 text-purple-700", Payment: "bg-blue-100 text-blue-700",
  Transfer: "bg-gray-100 text-gray-700", Adjustment: "bg-amber-100 text-amber-700",
  Journal: "bg-indigo-100 text-indigo-700", Accrual: "bg-teal-100 text-teal-700",
};

const approvalBadge: Record<Transaction["approvalStatus"], { label: string; cls: string; icon: React.ReactNode }> = {
  approved:        { label: "Approved",       cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  pending:         { label: "Pending",        cls: "bg-amber-100 text-amber-700",     icon: <Clock       className="w-3.5 h-3.5" /> },
  "auto-approved": { label: "Auto-Approved",  cls: "bg-gray-100 text-gray-600",       icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const APP_COLORS: Record<string, string> = {
  Procurement: "bg-blue-50 text-blue-700", Storefront: "bg-teal-50 text-teal-700",
  HR:          "bg-purple-50 text-purple-700", ESS: "bg-orange-50 text-orange-700",
  Projects:    "bg-indigo-50 text-indigo-700", Finance: "bg-emerald-50 text-emerald-700",
  "":          "bg-gray-100 text-gray-600",
};

function fmt(n: number) {
  return "₦" + n.toLocaleString();
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function TransactionDetailModal({ txn, onClose }: { txn: Transaction; onClose: () => void }) {
  const ab = approvalBadge[txn.approvalStatus];
  const lines = txnLines(txn);
  const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebits === totalCredits && totalDebits > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-gray-900">{txn.id}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[txn.type] ?? "bg-gray-100 text-gray-600"}`}>{txn.type}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Basic Information</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Description</p>
                <p className="font-medium text-gray-900 mt-0.5">{txn.description}</p>
              </div>
              <div><p className="text-xs text-gray-500">Transaction ID</p><p className="font-mono font-medium text-gray-900 mt-0.5">{txn.id}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="font-medium text-gray-900 mt-0.5">{txn.date}</p></div>
              <div><p className="text-xs text-gray-500">Reference</p><p className="font-mono font-medium text-gray-900 mt-0.5">{txn.reference}</p></div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-lg font-bold mt-0.5 text-gray-900">{fmt(txn.amount)}</p>
              </div>
              <div><p className="text-xs text-gray-500">Initiated By</p><p className="font-medium text-gray-900 mt-0.5">{txn.createdBy}</p></div>
              <div>
                <p className="text-xs text-gray-500">Approval Status</p>
                <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 text-xs rounded-full font-medium ${ab.cls}`}>{ab.icon}{ab.label}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Source Application</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded font-medium ${APP_COLORS[txn.sourceApp] ?? "bg-gray-100 text-gray-600"}`}>{txn.sourceApp || "—"}</span>
              </div>
              <div><p className="text-xs text-gray-500">Source Process</p><p className="font-medium text-gray-900 mt-0.5">{txn.sourceProcess || "—"}</p></div>
              {txn.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 mt-0.5 bg-gray-50 rounded-lg px-3 py-2">{txn.notes}</p>
                </div>
              )}
            </div>
          </section>
          <hr className="border-gray-100" />
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Journal Lines</p>
              <span className={`text-xs font-semibold ${balanced ? "text-emerald-600" : "text-red-600"}`}>
                {balanced ? "✓ Balanced" : `Difference ₦${Math.abs(totalDebits - totalCredits).toLocaleString()}`}
              </span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Debit</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{l.account || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{l.debit ? fmt(l.debit) : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-600">{l.credit ? fmt(l.credit) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-white/60">
                  <tr>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-500">Total</td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-700">{fmt(totalDebits)}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-red-600">{fmt(totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          {txn.linkedRecords && txn.linkedRecords.length > 0 && (
            <>
              <hr className="border-gray-100" />
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Linked Records</p>
                <div className="flex flex-wrap gap-2">
                  {txn.linkedRecords.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <span className="text-xs text-gray-500">{r.label}:</span>
                      <span className="text-xs font-mono font-semibold text-blue-700">{r.ref}</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function TransactionsLedgerPage() {
  const { transactions } = useFinance();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const totalDebits = transactions.reduce((s, t) => s + txnLines(t).reduce((x, l) => x + (l.debit || 0), 0), 0);
  const totalCredits = transactions.reduce((s, t) => s + txnLines(t).reduce((x, l) => x + (l.credit || 0), 0), 0);
  const net = totalDebits - totalCredits;

  function handleExport() {
    exportCSV("transactions-ledger",
      ["Transaction ID", "Type", "Description", "Reference", "Amount", "Date", "Source App", "Source Process", "Approval Status", "Created By"],
      transactions.map((t) => [t.id, t.type, t.description, t.reference, fmt(t.amount), t.date, t.sourceApp, t.sourceProcess, t.approvalStatus, t.createdBy]),
    );
  }

  const columns: Column<Transaction>[] = [
    { key: "id", label: "Transaction ID", render: t => <span className="font-mono text-xs text-gray-500 group-hover:text-emerald-700">{t.id}</span>, sortable: true, filterable: true },
    { key: "type", label: "Type", render: t => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[t.type] ?? "bg-gray-100 text-gray-600"}`}>{t.type}</span>, sortable: true, filterable: true },
    { key: "description", label: "Description", render: t => <span className="text-sm text-gray-900 max-w-[200px] block truncate">{t.description}</span>, sortable: true, filterable: true, minWidth: 160 },
    { key: "accounts", label: "DR / CR", render: t => (
      <div>
        <p className="text-xs font-mono text-gray-600 truncate max-w-[140px]">{t.debitAccount || "—"}</p>
        <p className="text-xs font-mono text-gray-400 truncate max-w-[140px]">{t.creditAccount || "—"}</p>
      </div>
    ), sortable: false, filterable: false, minWidth: 160 },
    { key: "source", label: "Source", render: t => (
      <div>
        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${APP_COLORS[t.sourceApp] ?? "bg-gray-100 text-gray-600"}`}>{t.sourceApp || "—"}</span>
        <p className="text-xs text-gray-400 mt-0.5">{t.sourceProcess || "—"}</p>
      </div>
    ), sortable: true, filterable: true },
    { key: "amount", label: "Amount (₦)", render: t => (
      <span className="text-sm font-semibold text-gray-900">{fmt(t.amount)}</span>
    ), sortable: true, filterable: false, className: "text-right", headerClassName: "text-right" },
    { key: "date", label: "Date", render: t => <span className="text-sm text-gray-500 whitespace-nowrap">{t.date}</span>, sortable: true, filterable: false },
    { key: "approval", label: "Approval", render: t => {
      const ab = approvalBadge[t.approvalStatus];
      return <span className={`flex items-center gap-1 w-fit text-xs rounded-full px-2 py-0.5 font-medium ${ab.cls}`}>{ab.icon}{ab.label}</span>;
    }, sortable: true, filterable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions Ledger</h1>
          <p className="text-sm text-gray-500 mt-0.5">Posted postings from Journal Entries, Payments, Invoices, and the Posting Engine — click any row to view full details</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Total Debits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalDebits)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Total Credits</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalCredits)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Net Position</p>
          <p className={`text-2xl font-bold mt-1 ${net === 0 ? "text-gray-600" : net > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {fmt(net)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Balanced ledger: {net === 0 ? "Debits = Credits" : "Check entries"}</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={t => t.id}
        searchPlaceholder="Search: ID, description, account…"
        searchFields={[t => t.id, t => t.description, t => t.debitAccount, t => t.creditAccount, t => t.reference, t => t.sourceApp, t => t.sourceProcess]}
        emptyMessage="No posted transactions yet — post a journal entry or pay an invoice to see it here"
        onRowClick={setSelected}
      />

      {selected && <TransactionDetailModal txn={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}