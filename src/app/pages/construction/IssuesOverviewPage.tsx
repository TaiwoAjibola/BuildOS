import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { projects, issues, fmtDate } from "./mockData";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Open: { bg: "#FDE8E6", text: "#B33A2E" },
  "Under Investigation": { bg: "#FEF6E6", text: "#B0780F" },
  "In Progress": { bg: "#E8F0FE", text: "#1A5BB3" },
  Escalated: { bg: "#FDE8E6", text: "#B33A2E" },
  Resolved: { bg: "#E8F8EF", text: "#1B7A43" },
  Closed: { bg: "#E8F8EF", text: "#1B7A43" },
};

const IMPACT_COLORS: Record<string, { bg: string; text: string }> = {
  Schedule: { bg: "#FEF6E6", text: "#B0780F" },
  Cost: { bg: "#FDE8E6", text: "#B33A2E" },
  Quality: { bg: "#E8F0FE", text: "#1A5BB3" },
  Safety: { bg: "#FDE8E6", text: "#B33A2E" },
};

export function IssuesOverviewPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const open = issues.filter(i => i.status === "Open");
  const inProgress = issues.filter(i => i.status === "In Progress" || i.status === "Under Investigation" || i.status === "Escalated");
  const resolved = issues.filter(i => i.status === "Resolved" || i.status === "Closed");

  const stats = [
    { icon: AlertTriangle, label: "Total Issues", value: issues.length },
    { icon: XCircle, label: "Open", value: open.length, color: "#E74C3C" },
    { icon: Clock, label: "In Progress", value: inProgress.length, color: "#F4A623" },
    { icon: CheckCircle, label: "Resolved/Closed", value: resolved.length, color: "#27AE60" },
  ];

  const filtered = issues.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#F7F8FA" }} className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A202C" }}>Issues Overview</h1>
        <p className="text-sm mt-1" style={{ color: "#718096" }}>Issues across all projects</p>
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
            type="text" placeholder="Search issues..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#1A202C" }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E2E8F0" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Issue ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Project</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Title</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Impact</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Owner</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Target Date</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "#718096" }}>Days Open</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue, i) => {
                const project = projects.find(p => p.id === issue.projectId);
                const st = STATUS_STYLES[issue.status] ?? { bg: "#F1F5F9", text: "#475569" };
                const daysOpen = Math.floor((Date.now() - new Date(issue.dateRaised).getTime()) / 86400000);
                return (
                  <tr
                    key={issue.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #E2E8F0" : "none" }}
                    onClick={() => navigate(`/apps/construction/projects/${issue.projectId}/issues`)}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "#1A202C" }}>{issue.issueNumber}</td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{project?.name ?? issue.projectId}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "#1A202C" }}>{issue.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {issue.impactTypes.map(t => {
                          const ic = IMPACT_COLORS[t] ?? { bg: "#F1F5F9", text: "#475569" };
                          return (
                            <span key={t} className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: ic.bg, color: ic.text }}>
                              {t}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{issue.ownerId}</td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{fmtDate(issue.targetDate)}</td>
                    <td className="text-center px-4 py-3 font-medium" style={{ color: daysOpen > 30 ? "#E74C3C" : "#718096" }}>{daysOpen}</td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{ color: "#718096" }} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-sm" style={{ color: "#718096" }}>No issues found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
