import { useMemo } from "react";
import { BookOpen, Download } from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { DataTable, type Column } from "../../components/DataTable";
import { useFinance, type Transaction, type LedgerLine } from "../../stores/financeStore";

function linesOf(t: Transaction): LedgerLine[] {
  if (t.lines && t.lines.length > 0) return t.lines;
  if (t.debitAccount && t.creditAccount) {
    return [
      { id: `${t.id}-d`, account: t.debitAccount, debit: Math.abs(t.amount), credit: 0, description: "" },
      { id: `${t.id}-c`, account: t.creditAccount, debit: 0, credit: Math.abs(t.amount), description: "" },
    ];
  }
  return [];
}

interface GLRow {
  key: string;
  date: string;
  reference: string;
  sourceProcess: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const fmt = (n: number) => "₦" + n.toLocaleString();

export function GeneralLedgerPage() {
  const { transactions } = useFinance();

  const { rows, totalDebits, totalCredits } = useMemo(() => {
    const balanceByAccount: Record<string, number> = {};
    const out: GLRow[] = [];
    const sorted = [...transactions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)));

    for (const txn of sorted) {
      for (const line of linesOf(txn)) {
        const key = `${txn.id}-${line.id}`;
        balanceByAccount[line.account] = (balanceByAccount[line.account] ?? 0) + (line.debit || 0) - (line.credit || 0);
        out.push({
          key,
          date: txn.date,
          reference: txn.reference,
          sourceProcess: txn.sourceProcess || txn.sourceApp,
          account: line.account || "—",
          description: txn.description + (line.description ? ` — ${line.description}` : ""),
          debit: line.debit || 0,
          credit: line.credit || 0,
          balance: balanceByAccount[line.account],
        });
      }
    }
    const totalDebits = out.reduce((s, r) => s + r.debit, 0);
    const totalCredits = out.reduce((s, r) => s + r.credit, 0);
    return { rows: out, totalDebits, totalCredits };
  }, [transactions]);

  function handleExport() {
    exportCSV("general-ledger",
      ["Date", "Reference", "Source/Process", "Account", "Description", "Debit", "Credit", "Balance"],
      rows.map(r => [r.date, r.reference, r.sourceProcess, r.account, r.description, r.debit || "", r.credit || "", r.balance]));
  }

  const columns: Column<GLRow>[] = [
    { key: "date", label: "Date", sortable: true, filterable: true,
      render: (r) => <span className="text-sm text-gray-500 whitespace-nowrap">{r.date}</span> },
    { key: "reference", label: "Reference", sortable: true, filterable: true,
      render: (r) => <span className="font-mono text-xs text-gray-600">{r.reference}</span> },
    { key: "sourceProcess", label: "Source/Process", sortable: true, filterable: true,
      render: (r) => <span className="text-xs text-gray-500">{r.sourceProcess || "—"}</span> },
    { key: "account", label: "Account", sortable: true, filterable: true, minWidth: 170,
      render: (r) => <span className="font-mono text-xs text-gray-700">{r.account}</span> },
    { key: "description", label: "Description", sortable: true, filterable: true, minWidth: 220,
      render: (r) => <span className="text-sm text-gray-900 max-w-[260px] block truncate" title={r.description}>{r.description}</span> },
    { key: "debit", label: "Debit", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (r) => r.debit ? <span className="text-sm font-medium text-emerald-700">{fmt(r.debit)}</span> : <span className="text-gray-300">—</span> },
    { key: "credit", label: "Credit", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (r) => r.credit ? <span className="text-sm font-medium text-red-600">{fmt(r.credit)}</span> : <span className="text-gray-300">—</span> },
    { key: "balance", label: "Balance", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (r) => <span className={`text-sm font-semibold ${r.balance >= 0 ? "text-gray-800" : "text-red-600"}`}>{fmt(Math.abs(r.balance))}{r.balance < 0 ? " CR" : " DR"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">General Ledger</h1>
          <p className="text-sm text-gray-500 mt-0.5">Consolidated view of every posted accounting transaction across all modules — journal entries, payments, purchases and payroll</p>
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
          <p className="text-xs text-gray-500 font-medium">Ledger Status</p>
          <p className={`text-2xl font-bold mt-1 ${totalDebits === totalCredits ? "text-emerald-600" : "text-red-600"}`}>
            {totalDebits === totalCredits ? "✓ Balanced" : "⚠ Unbalanced"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{rows.length} journal lines · {transactions.length} postings</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={r => r.key}
        searchPlaceholder="Search reference, account, description…"
        searchFields={[r => r.reference, r => r.account, r => r.description, r => r.sourceProcess]}
        emptyMessage="No postings yet — post a journal entry, payment or payroll to see it here"
      />
    </div>
  );
}