import { useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { BarChart3, FileText, Download, Filter, Calendar, Clock, TrendingUp, PieChart, Table, CheckCircle, ChevronRight, Eye } from "lucide-react";
import { projects, fmtCurrency } from "./mockData";

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: string;
}

interface PreviewData {
  labels: string[];
  datasets: { label: string; values: number[]; color: string }[];
}

const reportTemplates: ReportTemplate[] = [
  { id: "portfolio", title: "Portfolio Summary", description: "Aggregate budget, spend, and progress across all construction projects.", icon: <PieChart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", type: "portfolio" },
  { id: "rag", title: "RAG Status Report", description: "Project health overview — on-track, at-risk, and delayed projects with key metrics.", icon: <BarChart3 className="w-5 h-5" />, color: "text-orange-600 bg-orange-50", type: "rag" },
  { id: "schedule", title: "Schedule Report", description: "Timeline adherence, milestone completion, and schedule variance analysis.", icon: <Calendar className="w-5 h-5" />, color: "text-purple-600 bg-purple-50", type: "schedule" },
  { id: "cost", title: "Cost Report", description: "Budget utilisation, cost variance, and expenditure forecasting by project.", icon: <FileText className="w-5 h-5" />, color: "text-green-600 bg-green-50", type: "cost" },
];

function generatePreview(type: string): PreviewData {
  switch (type) {
    case "portfolio":
      return {
        labels: projects.map(p => p.name.slice(0, 12)),
        datasets: [
          { label: "Budget", values: projects.map(p => p.budget), color: "#E8973A" },
          { label: "Spent", values: projects.map(p => p.spent), color: "#3B82F6" },
        ],
      };
    case "rag": {
      const counts = { "on-track": 0, "at-risk": 0, "delayed": 0 };
      projects.forEach(p => { if (p.status !== "Completed") counts[p.ragStatus]++; });
      return {
        labels: ["On Track", "At Risk", "Delayed"],
        datasets: [{ label: "Projects", values: [counts["on-track"], counts["at-risk"], counts["delayed"]], color: "#E8973A" }],
      };
    }
    case "schedule":
      return {
        labels: projects.filter(p => p.status !== "Completed").map(p => p.name.slice(0, 12)),
        datasets: [{ label: "Progress %", values: projects.filter(p => p.status !== "Completed").map(p => Math.round((p.spent / p.budget) * 100)), color: "#E8973A" }],
      };
    case "cost":
      return {
        labels: projects.map(p => p.name.slice(0, 12)),
        datasets: [
          { label: "Utilisation %", values: projects.map(p => Math.round((p.spent / p.budget) * 100)), color: "#E8973A" },
        ],
      };
    default:
      return { labels: [], datasets: [] };
  }
}

export function ReportsPage() {
  const navigate = useNavigate();
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleGenerate(id: string) {
    setGeneratedIds(prev => new Set(prev).add(id));
    setTimeout(() => showToast("Report generated"), 1000);
  }

  const previewData = previewId ? generatePreview(previewId) : null;

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);

  return (
    <div className="space-y-5">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Construction analytics and report templates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Total Portfolio: <strong className="text-gray-900">{fmtCurrency(totalBudget)}</strong></span>
        </div>
      </div>

      {/* Portfolio summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Projects</p>
          <p className="text-xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-xs text-gray-400">{projects.filter(p => p.status === "Active").length} active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Budget</p>
          <p className="text-xl font-bold text-gray-900">{fmtCurrency(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-xl font-bold text-blue-600">{fmtCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Avg Utilisation</p>
          <p className="text-xl font-bold text-gray-900">{Math.round((totalSpent / totalBudget) * 100)}%</p>
        </div>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-2 gap-4">
        {reportTemplates.map(r => {
          const isGenerated = generatedIds.has(r.id);
          const isPreview = previewId === r.id;
          return (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4 mb-4">
                <span className={`p-2.5 rounded-xl ${r.color}`}>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{r.description}</p>
                </div>
                {isGenerated && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
              </div>

              {/* Mini preview chart */}
              {isPreview && previewData && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Preview</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {previewData.datasets[0].values.slice(0, 7).map((v, i) => {
                      const maxVal = Math.max(...previewData.datasets[0].values, 1);
                      const heightPct = (v / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-sm"
                            style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: previewData.datasets[0].color }}
                          />
                          <span className="text-[8px] text-gray-400 truncate w-full text-center">{previewData.labels[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { handleGenerate(r.id); setPreviewId(isPreview ? null : r.id); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isGenerated
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  {isGenerated ? <><CheckCircle className="w-3.5 h-3.5" /> Generated</> : <><BarChart3 className="w-3.5 h-3.5" /> Generate</>}
                </button>
                <button
                  onClick={() => showToast(`Exporting "${r.title}" as PDF`)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project summary table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Project Summary</h3>
          <button onClick={() => showToast("Exporting project summary table")} className="flex items-center gap-1.5 text-xs text-orange-600 font-medium hover:text-orange-700">
            <Download className="w-3.5 h-3.5" /> Export Table
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Spent</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Utilisation</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map(p => {
              const pct = Math.round((p.spent / p.budget) * 100);
              const statusBadge = p.status === "Active" ? "bg-green-100 text-green-700" :
                p.status === "On Hold" ? "bg-amber-100 text-amber-700" :
                p.status === "Completed" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700";
              const ragDot = p.ragStatus === "on-track" ? "bg-green-500" :
                p.ragStatus === "at-risk" ? "bg-amber-500" : "bg-red-500";
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ragDot}`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge}`}>{p.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{fmtCurrency(p.budget)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtCurrency(p.spent)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/apps/construction/projects/${p.id}/overview`)}
                      className="text-xs text-orange-600 font-medium hover:text-orange-700"
                    >
                      View <ChevronRight className="w-3 h-3 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Need more detailed reports?</strong> Use the Admin → Report Builder to create custom report templates with specific metrics and filters.
        </p>
      </div>
    </div>
  );
}
