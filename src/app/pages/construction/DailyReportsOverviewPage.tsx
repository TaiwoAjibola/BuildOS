import { useNavigate } from "react-router";
import { FileText, Sun, Cloud, CloudDrizzle, CloudRain, Eye, ChevronRight } from "lucide-react";
import { useState } from "react";
import { projects, dailyReports, fmtDate } from "./mockData";

const WEATHER_ICON: Record<string, typeof Sun> = { Sunny: Sun, Cloudy: Cloud, Drizzle: CloudDrizzle, Rainy: CloudRain };
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#F1F5F9", text: "#475569" },
  submitted: { bg: "#E8F8EF", text: "#1B7A43" },
};

export function DailyReportsOverviewPage() {
  const navigate = useNavigate();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const thisWeek = dailyReports.filter(r => new Date(r.reportDate) >= weekAgo);

  const stats = [
    { icon: FileText, label: "Total Reports", value: dailyReports.length },
    { icon: FileText, label: "Drafts", value: dailyReports.filter(r => r.status === "draft").length, color: "#F4A623" },
    { icon: FileText, label: "Submitted", value: dailyReports.filter(r => r.status === "submitted").length, color: "#27AE60" },
    { icon: Eye, label: "Reports this week", value: thisWeek.length, color: "#E8973A" },
  ];

  const sorted = [...dailyReports].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

  return (
    <div style={{ backgroundColor: "#F7F8FA" }} className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A202C" }}>Daily Reports Overview</h1>
        <p className="text-sm mt-1" style={{ color: "#718096" }}>Daily reports across all projects</p>
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

      <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E2E8F0" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Project</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Date</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Weather</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Submitted By</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#718096" }}>Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const WeatherIcon = WEATHER_ICON[r.weather] ?? Sun;
                const project = projects.find(p => p.id === r.projectId);
                const st = STATUS_STYLES[r.status] ?? { bg: "#F1F5F9", text: "#475569" };
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: i < sorted.length - 1 ? "1px solid #E2E8F0" : "none" }}
                    onClick={() => navigate(`/apps/construction/projects/${r.projectId}/daily-reports`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "#1A202C" }}>{project?.name ?? r.projectId}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#1A202C" }}>{fmtDate(r.reportDate)}</td>
                    <td className="px-4 py-3"><WeatherIcon className="w-4 h-4" style={{ color: "#718096" }} /></td>
                    <td className="px-4 py-3" style={{ color: "#718096" }}>{r.submittedBy}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4" style={{ color: "#718096" }} /></td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: "#718096" }}>No daily reports found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
