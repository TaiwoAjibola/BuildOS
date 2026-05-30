import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search, MapPin, Building2, Clock, AlertTriangle,
  ChevronDown, BarChart3, DollarSign, FolderKanban,
} from "lucide-react";
import {
  projects as allProjects, clusters, fmtCurrency, fmtDate,
  ragLabel, getReportsByProject,
} from "./mockData";
import type { RAGStatus } from "./types";

const RAG_HEX: Record<RAGStatus, string> = {
  "on-track": "#27AE60",
  "at-risk": "#F4A623",
  "delayed": "#E74C3C",
};

const RAG_BG_HEX: Record<RAGStatus, string> = {
  "on-track": "#E8F8F0",
  "at-risk": "#FEF5E7",
  "delayed": "#FDEDED",
};

function getLastReportInfo(projectId: string): { date: string | null; overdue: boolean } {
  const reports = getReportsByProject(projectId);
  if (reports.length === 0) return { date: null, overdue: true };
  const sorted = [...reports].sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  );
  const lastDate = sorted[0].reportDate;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return { date: lastDate, overdue: daysSince > 1 };
}

export function PortfolioDashboardPage() {
  const navigate = useNavigate();
  const [clusterFilter, setClusterFilter] = useState("All");
  const [ragFilter, setRagFilter] = useState<RAGStatus | "All">("All");
  const [search, setSearch] = useState("");

  const activeProjects = useMemo(
    () => allProjects.filter(p => p.status === "Active"),
    []
  );

  const stats = useMemo(() => {
    const onTrack = activeProjects.filter(p => p.ragStatus === "on-track").length;
    const atRisk = activeProjects.filter(p => p.ragStatus === "at-risk").length;
    const delayed = activeProjects.filter(p => p.ragStatus === "delayed").length;
    const totalBudget = allProjects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = allProjects.reduce((s, p) => s + p.spent, 0);
    return [
      { label: "Active Projects", value: activeProjects.length, icon: FolderKanban, accent: "#E8973A" },
      { label: "On Track", value: onTrack, dot: true, accent: RAG_HEX["on-track"] },
      { label: "At Risk", value: atRisk, dot: true, accent: RAG_HEX["at-risk"] },
      { label: "Delayed", value: delayed, dot: true, accent: RAG_HEX["delayed"] },
      { label: "Total Budget", value: fmtCurrency(totalBudget), icon: DollarSign, accent: "#1A202C" },
      { label: "Total Spent", value: fmtCurrency(totalSpent), icon: BarChart3, accent: "#718096" },
    ];
  }, [activeProjects]);

  const filtered = useMemo(
    () => activeProjects.filter(p => {
      if (clusterFilter !== "All" && p.clusterId !== clusterFilter) return false;
      if (ragFilter !== "All" && p.ragStatus !== ragFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.client.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [activeProjects, clusterFilter, ragFilter, search]
  );

  return (
    <div className="space-y-5">
      {/* Dark header */}
      <div
        className="rounded-lg p-5 flex items-center justify-between"
        style={{ backgroundColor: "#1C2333" }}
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Portfolio Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Executive overview &middot; {activeProjects.length} active projects
          </p>
        </div>
        <div
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "rgba(232,151,58,0.15)", color: "#E8973A" }}
        >
          Q2 2026
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-white rounded-lg border p-4"
            style={{ borderColor: "#E2E8F0" }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "#718096" }}>{s.label}</p>
            <div className="flex items-center gap-2">
              {"dot" in s && s.dot ? (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.accent }} />
              ) : "icon" in s && s.icon ? (
                <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: s.accent }} />
              ) : null}
              <span className="text-lg font-bold" style={{ color: "#1A202C" }}>
                {s.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div
        className="bg-white rounded-lg border p-4"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={clusterFilter}
              onChange={e => setClusterFilter(e.target.value)}
              className="appearance-none border rounded-md text-sm pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ borderColor: "#E2E8F0", color: "#1A202C" }}
            >
              <option value="All">All Clusters</option>
              {clusters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#718096" }} />
          </div>
          <div className="relative">
            <select
              value={ragFilter}
              onChange={e => setRagFilter(e.target.value as RAGStatus | "All")}
              className="appearance-none border rounded-md text-sm pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ borderColor: "#E2E8F0", color: "#1A202C" }}
            >
              <option value="All">All Statuses</option>
              {(["on-track", "at-risk", "delayed"] as const).map(r => (
                <option key={r} value={r}>{ragLabel(r)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#718096" }} />
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#718096" }} />
            <input
              type="text"
              placeholder="Search by project or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ borderColor: "#E2E8F0", color: "#1A202C" }}
            />
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: "#718096" }}>
            {filtered.length} of {activeProjects.length} projects
          </span>
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(project => {
          const reportInfo = getLastReportInfo(project.id);
          const pct = Math.min(Math.round((project.spent / project.budget) * 100), 100);
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/apps/construction/projects/${project.id}`)}
              className="bg-white rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="p-4 space-y-3">
                {/* Name + RAG badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold truncate" style={{ color: "#1A202C" }}>
                    {project.name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: RAG_BG_HEX[project.ragStatus], color: RAG_HEX[project.ragStatus] }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RAG_HEX[project.ragStatus] }} />
                    {ragLabel(project.ragStatus)}
                  </span>
                </div>

                {/* Client + location */}
                <div className="space-y-1 text-xs" style={{ color: "#718096" }}>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{project.client}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "#718096" }}>Overall</span>
                    <span className="font-medium" style={{ color: "#1A202C" }}>{pct}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "#E2E8F0" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: RAG_HEX[project.ragStatus] }}
                    />
                  </div>
                </div>

                {/* Schedule status + last report */}
                <div
                  className="flex items-center justify-between text-xs pt-2"
                  style={{ borderTop: "1px solid #E2E8F0", color: "#718096" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{ragLabel(project.ragStatus)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {reportInfo.overdue && (
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "#F4A623" }} />
                    )}
                    <span>
                      {reportInfo.date ? fmtDate(reportInfo.date) : "No report"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="w-10 h-10 mx-auto mb-3" style={{ color: "#CBD5E0" }} />
          <p className="text-sm font-medium" style={{ color: "#718096" }}>No matching projects</p>
          <p className="text-xs mt-1" style={{ color: "#A0AEC0" }}>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
