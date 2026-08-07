import { Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";

export interface JournalLineInput {
  id: string;
  account: string;   // "<code> <name>" matching the Chart of Accounts
  debit: number;
  credit: number;
  description: string;
}

export const newJournalLine = (): JournalLineInput => ({
  id: `ln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  account: "",
  debit: 0,
  credit: 0,
  description: "",
});

interface JournalLinesEditorProps {
  lines: JournalLineInput[];
  onChange: (lines: JournalLineInput[]) => void;
  accounts: { code: string; name: string }[];
  minLines?: number;
  disabled?: boolean;
}

/**
 * Shared double-entry journal lines editor used by Journal Entries, Purchase
 * Invoice payments, and Payment postings. A single posting is a collection of
 * debit/credit lines that must balance (total debits === total credits) before
 * it can be posted.
 */
export function JournalLinesEditor({ lines, onChange, accounts, minLines = 1, disabled = false }: JournalLinesEditorProps) {
  function update(id: string, field: keyof JournalLineInput, value: string | number) {
    onChange(lines.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function add() {
    onChange([...lines, newJournalLine()]);
  }

  function remove(id: string) {
    if (lines.length <= minLines) return;
    onChange(lines.filter(l => l.id !== id));
  }

  const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const diff = totalDebits - totalCredits;
  const balanced = totalDebits > 0 && diff === 0;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Account</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-32">Debit</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-32">Credit</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line) => (
            <tr key={line.id}>
              <td className="px-2 py-1.5">
                <select
                  value={line.account}
                  disabled={disabled}
                  onChange={(e) => update(line.id, "account", e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 ${disabled ? "bg-gray-50 text-gray-500" : "bg-white"}`}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.code} value={`${a.code} ${a.name}`}>{`${a.code} — ${a.name}`}</option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="number" min={0} value={line.debit || ""}
                  disabled={disabled || line.credit > 0}
                  onChange={(e) => update(line.id, "debit", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="number" min={0} value={line.credit || ""}
                  disabled={disabled || line.debit > 0}
                  onChange={(e) => update(line.id, "credit", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  value={line.description}
                  disabled={disabled}
                  onChange={(e) => update(line.id, "description", e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </td>
              <td className="px-2 py-1.5">
                {!disabled && lines.length > minLines && (
                  <button
                    onClick={() => remove(line.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove line"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Totals:</td>
            <td className="px-3 py-2 text-xs font-bold text-emerald-700">{totalDebits.toLocaleString()}</td>
            <td className="px-3 py-2 text-xs font-bold text-red-600">{totalCredits.toLocaleString()}</td>
            <td colSpan={2} className="px-3 py-2">
              {totalDebits > 0 && (
                balanced
                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Entry is balanced</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Entry is not balanced — {diff > 0 ? "Debits" : "Credits"} exceed by ₦{Math.abs(diff).toLocaleString()}
                    </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
      {!disabled && (
        <button onClick={add} className="w-full py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 border-t border-gray-100 flex items-center justify-center gap-1">
          + Add Line
        </button>
      )}
    </div>
  );
}