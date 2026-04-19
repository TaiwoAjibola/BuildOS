import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FolderKanban, AlertTriangle, TrendingUp, Users, Clock,
  DollarSign, CheckCircle, XCircle, ArrowUpRight, ArrowRight,
  HardHat, Wrench, Package, BarChart3, ChevronRight,
} from "lucide-react";

const kpis = [
  {
    label: "Active Projects",
    value: "12",
    sub: "+2 from last month",
    subColor: "text-green-600",
    icon: <FolderKanban className="w-5 h-5" />,
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    label: "Delayed Projects",
    value: "3",
    sub: "Requires immediate action",
    subColor: "text-red-500",
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: "bg-red-100 text-red-600",
  },
  {
    label: "Avg. Progress",
    value: "64%",
    sub: "+5% this month",
    subColor: "text-green-600",
    icon: <TrendingUp className="w-5 h-5" />,
    iconBg: "bg-green-100 text-green-600",
  },
  {
    label: "Total Workforce",
    value: "156",
    sub: "Across all sites",
    subColor: "text-gray-500",
    icon: <Users className="w-5 h-5" />,
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    label: "Total Budget",
    value: "₦4.8B",
    sub: "₦3.1B spent (65%)",
    subColor: "text-gray-500",
    icon: <DollarSign className="w-5 h-5" />,
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    label: "Pending Approvals",
    value: "8",
    sub: "3 urgent",
    subColor: "text-amber-600",
    icon: <Clock className="w-5 h-5" />,
    iconBg: "bg-amber-100 text-amber-600",
  },
];

const projects = [
  { id: "1", name: "Downtown Office Complex", location: "New York, NY", progress: 65, status: "on-track", budget: 12500000, spent: 8125000, dueDate: "Dec 2026", manager: "John Smith" },
  { id: "2", name: "Riverside Residential", location: "Austin, TX", progress: 42, status: "at-risk", budget: 8200000, spent: 4100000, dueDate: "Sep 2026", manager: "Sarah Johnson" },
  { id: "3", name: "Industrial Warehouse", location: "Chicago, IL", progress: 15, status: "on-track", budget: 5800000, spent: 870000, dueDate: "Feb 2027", manager: "Mike Davis" },
  { id: "4", name: "Shopping Mall Renovation", location: "Los Angeles, CA", progress: 78, status: "delayed", budget: 18400000, spent: 16560000, dueDate: "Jun 2026 (overdue)", manager: "Emily Chen" },
  { id: "5", name: "Highway Interchange", location: "Dallas, TX", progress: 33, status: "delayed", budget: 32000000, spent: 11200000, dueDate: "Mar 2026 (overdue)", manager: "Robert Lee" },
];

const alerts = [
  { type: "error",   icon: <XCircle       className="w-4 h-4 text-red-500"   />, title: "Shopping Mall Renovation is overdue",    desc: "Completion date passed 3 weeks ago. Escalation required.",        link: "/apps/construction" },
  { type: "error",   icon: <XCircle       className="w-4 h-4 text-red-500"   />, title: "Highway Interchange behind schedule",    desc: "12% behind projected timeline. Resource reallocation needed.",   link: "/apps/construction/resource-planning" },
  { type: "warning", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, title: "Riverside Residential at risk",           desc: "Material shortages may cause 2-week delay.",                      link: "/apps/construction/approvals" },
  { type: "warning", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, title: "8 approvals awaiting review",            desc: "3 are urgent material requests over ₦500K.",                     link: "/apps/construction/approvals" },
  { type: "info",    icon: <CheckCircle   className="w-4 h-4 text-green-500" />, title: "Foundation milestone completed",         desc: "Downtown Office Complex — Phase 1 signed off.",                  link: "/apps/construction/projects/1" },
];

const activity = [
  { dot: "bg-orange-500", title: "Project milestone completed", desc: "Downtown Office Complex — 2 hours ago", user: "John Smith" },
  { dot: "bg-green-500", title: "Material request approved", desc: "Riverside Residential — 4 hours ago", user: "Admin" },
  { dot: "bg-amber-500", title: "Approval pending", desc: "Shopping Mall Renovation — 6 hours ago", user: "Emily Chen" },
  { dot: "bg-blue-500", title: "New project created", desc: "Industrial Warehouse — Yesterday", user: "Mike Davis" },
  { dot: "bg-red-500", title: "Budget overrun flagged", desc: "Shopping Mall Renovation — Yesterday", user: "Finance" },
  { dot: "bg-orange-500", title: "Team member added", desc: "Highway Interchange — 2 days ago", user: "Robert Lee" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "on-track": { label: "On Track", color: "text-green-700", bg: "bg-green-100" },
  "at-risk": { label: "At Risk", color: "text-amber-700", bg: "bg-amber-100" },
  "delayed": { label: "Delayed", color: "text-red-700", bg: "bg-red-100" },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${(n / 1000).toFixed(0)}K`;
}

export function ConstructionDashboardPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<"all" | "on-track" | "at-risk" | "delayed">("all");

  const filtered = projects.filter(p => activeFilter === "all" || p.status === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Construction Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of all construction activities — April 2026</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/apps/construction/approvals")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Clock className="w-3.5 h-3.5" />
            View Approvals
          </button>
          <button
            onClick={() => navigate("/apps/construction")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            All Projects
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">{k.label}</p>
              <span className={`p-1.5 rounded-md ${k.iconBg}`}>{k.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className={`text-xs mt-1 ${k.subColor}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Active Alerts</h2>
          <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">
            {alerts.filter(a => a.type === "error").length} critical
          </span>
        </div>
        <div className="space-y-2.5">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-md ${
              a.type === "error" ? "bg-red-50 border border-red-100" :
              a.type === "warning" ? "bg-amber-50 border border-amber-100" :
              "bg-green-50 border border-green-100"
            }`}>
              <div className="mt-0.5">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
              <button onClick={() => navigate(a.link)} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Project Progress Table */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Project Overview</h2>
            <div className="flex gap-1">
              {(["all", "on-track", "at-risk", "delayed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs capitalize transition-colors ${
                    activeFilter === f
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {f === "all" ? "All" : f.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map(p => {
              const sc = statusConfig[p.status];
              const budgetPct = Math.round((p.spent / p.budget) * 100);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => navigate(`/apps/construction/projects/${p.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{p.location} · {p.manager}</p>
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-900">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${p.status === "delayed" ? "bg-red-500" : p.status === "at-risk" ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Budget</span>
                      <span className="text-xs font-medium text-gray-900">{budgetPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${budgetPct > 90 ? "bg-red-500" : budgetPct > 75 ? "bg-amber-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-900">{fmt(p.budget)}</p>
                    <p className="text-xs text-gray-400">Due: {p.dueDate}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => navigate("/apps/construction")}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              View all projects <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-5">
          {/* Status breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "On Track", count: 7, pct: 58, color: "bg-green-500" },
                { label: "At Risk", count: 2, pct: 17, color: "bg-amber-500" },
                { label: "Delayed", count: 3, pct: 25, color: "bg-red-500" },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-sm text-gray-700">{s.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{s.count} projects</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${s.color} h-2 rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">₦4.8B</p>
                <p className="text-xs text-gray-400">Total Budget</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">₦3.1B</p>
                <p className="text-xs text-gray-400">Total Spent</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">65%</p>
                <p className="text-xs text-gray-400">Utilised</p>
              </div>
            </div>
          </div>

          {/* Module quick access */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Approvals", href: "/apps/construction/approvals", icon: <CheckCircle className="w-4 h-4" />, count: "8 pending", color: "text-amber-600 bg-amber-50" },
                { label: "Documents", href: "/apps/construction/documents", icon: <HardHat className="w-4 h-4" />, count: "156 files", color: "text-blue-600 bg-blue-50" },
                { label: "Resources", href: "/apps/construction/resource-planning", icon: <Users className="w-4 h-4" />, count: "156 workers", color: "text-purple-600 bg-purple-50" },
                { label: "Materials", href: "/apps/construction/approvals",       icon: <Package    className="w-4 h-4" />, count: "12 requests",   color: "text-green-600 bg-green-50"  },
              ].map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.href)}
                  className="flex flex-col items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50/30 transition-colors text-left"
                >
                  <span className={`p-1.5 rounded-md ${qa.color}`}>{qa.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{qa.label}</p>
                    <p className="text-xs text-gray-400">{qa.count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 leading-snug">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
