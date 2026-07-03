import { useState } from "react";
import { History, Search, X, RotateCcw, Filter } from "lucide-react";
import { useChangelog } from "../../stores/changelogStore";

const MODULES = ["Finance", "HR", "Procurement", "Projects", "Admin", "ESS", "Storefront"];

export function ChangelogPage() {
  const { entries, clearAll } = useChangelog();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string | "all">("all");

  const filtered = entries.filter(e => {
    if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
    if (search && ![e.summary, e.action, e.entityType, e.entityId, e.performedBy]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Changelog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all changes made across modules in the system</p>
        </div>
        {entries.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search changelog..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button onClick={() => setModuleFilter("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${moduleFilter === "all" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <Filter className="w-3 h-3 inline mr-1" />All
          </button>
          {MODULES.map(m => (
            <button key={m} onClick={() => setModuleFilter(m)} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${moduleFilter === m ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {m}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} entries</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Change History</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No changelog entries found.</p>
            <p className="text-xs text-gray-400 mt-1">Changes will appear here as you perform actions across the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(entry => {
              const moduleColors: Record<string, string> = {
                Finance: "bg-emerald-100 text-emerald-700", HR: "bg-blue-100 text-blue-700",
                Procurement: "bg-purple-100 text-purple-700", Projects: "bg-amber-100 text-amber-700",
                Admin: "bg-indigo-100 text-indigo-700", ESS: "bg-teal-100 text-teal-700",
                Storefront: "bg-orange-100 text-orange-700",
              };
              return (
                <div key={entry.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${moduleColors[entry.module] ?? "bg-gray-100 text-gray-600"}`}>{entry.module}</span>
                        <span className="text-xs font-medium text-gray-900">{entry.action}</span>
                        <span className="text-xs text-gray-400">{entry.entityType} · {entry.entityId}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{entry.summary}</p>
                      {entry.details && <p className="text-xs text-gray-400 mt-0.5">{entry.details}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-xs text-gray-400 mt-0.5">by {entry.performedBy}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
