import { useNavigate } from "react-router";
import { Truck, Award, Users, DollarSign, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { projects, vendors, fmtCurrency } from "./mockData";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active: { bg: "#E8F8EF", text: "#1B7A43" },
  Awarded: { bg: "#FEF6E6", text: "#B0780F" },
  Completed: { bg: "#E8F8EF", text: "#1B7A43" },
  Terminated: { bg: "#FDE8E6", text: "#B33A2E" },
};

type SortField = "name" | "project" | "trade" | "contractType" | "status" | "contractSum";

export function VendorsOverviewPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const active = vendors.filter(v => v.status === "Active");
  const nominated = vendors.filter(v => v.isNominated);
  const totalSum = vendors.reduce((s, v) => s + v.contractSum, 0);

  const stats = [
    { icon: Truck, label: "Total Vendors", value: vendors.length },
    { icon: Award, label: "Active", value: active.length, color: "#27AE60" },
    { icon: Users, label: "Nominated Subcontractors", value: nominated.length, color: "#E8973A" },
    { icon: DollarSign, label: "Total Contract Sum", value: fmtCurrency(totalSum), color: "#27AE60" },
  ];

  const filtered = useMemo(() => {
    let list = vendors.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.trade.toLowerCase().includes(search.toLowerCase())
    );
    if (sortField) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        if (sortField === "project") {
          va = projects.find(p => p.id === a.projectId)?.name ?? a.projectId;
          vb = projects.find(p => p.id === b.projectId)?.name ?? b.projectId;
        } else {
          va = a[sortField];
          vb = b[sortField];
        }
        if (typeof va === "number" && typeof vb === "number") {
          return sortDir === "asc" ? va - vb : vb - va;
        }
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return list;
  }, [search, sortField, sortDir]);

  return (
    <div style={{ backgroundColor: "#F7F8FA" }} className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A202C" }}>Vendors Overview</h1>
        <p className="text-sm mt-1" style={{ color: "#718096" }}>All vendors across projects</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-lg p-4 flex items-center gap-3" style={{ border: "1px solid #E2E8F0" }}>
              <Icon className="w-5 h-5" style={{ color: s.color ?? "#718096" }} />
              <div>
                <p className="text-xl font-bold" style={{ color: "#1A202C" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#718096" }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg p-4" style={{ border: "1px solid #E2E8F0" }}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#718096" }} />
          <input
            type="text" placeholder="Search vendors or trades..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#1A202C" }}
          />
        </div>

        <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E2E8F0" }}>
                    {[
                      { key: "name", label: "Vendor" },
                      { key: "project", label: "Project" },
                      { key: "trade", label: "Trade" },
                      { key: "contractType", label: "Contract Type" },
                      { key: "status", label: "Status" },
                      { key: "contractSum", label: "Contract Sum" },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key as SortField)}
                        className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-900 transition-colors ${
                          col.key === "contractSum" ? "text-right" : "text-left"
                        }`}
                        style={{ color: "#718096" }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        </span>
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
            <tbody>
              {filtered.map((v, i) => {
                const project = projects.find(p => p.id === v.projectId);
                const st = STATUS_STYLES[v.status] ?? { bg: "#F1F5F9", text: "#475569" };
                return (
                  <tr
                    key={v.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #E2E8F0" : "none" }}
                    onClick={() => navigate(`/apps/construction/vendors/${v.id}`)}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "#1A202C" }}>{v.name}</td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{project?.name ?? v.projectId}</td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{v.trade}</td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{v.contractType}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "#1A202C" }}>{fmtCurrency(v.contractSum)}</td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{ color: "#718096" }} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: "#718096" }}>No vendors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
