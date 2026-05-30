import { useParams } from "react-router";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, FileText, ClipboardList, Users, BookOpen, Siren, Award, Plus, Eye, Calendar, Search } from "lucide-react";
import { getProjectById, hseMatrix, fmtDate } from "./mockData";

type HSETab = "toolbox" | "incidents" | "permits" | "audits" | "drills" | "competency";

const subTabs: { id: HSETab; label: string; icon: React.ReactNode }[] = [
  { id: "toolbox", label: "Toolbox Talks", icon: <BookOpen className="w-4 h-4" /> },
  { id: "incidents", label: "Incident Log", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "permits", label: "Permits to Work", icon: <FileText className="w-4 h-4" /> },
  { id: "audits", label: "HSE Audits & Inspections", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "drills", label: "Emergency Drills", icon: <Siren className="w-4 h-4" /> },
  { id: "competency", label: "HSE Competency Matrix", icon: <Award className="w-4 h-4" /> },
];

const toolboxTalks = [
  { date: "2026-05-20", topic: "Safe Lifting Techniques", facilitator: "Diana Park", attendees: "24", notes: "All crew attended; demo conducted" },
  { date: "2026-05-22", topic: "Working at Height", facilitator: "James Okafor", attendees: "18", notes: "Focused on scaffolding safety" },
  { date: "2026-05-25", topic: "Fire Safety & Evacuation", facilitator: "Diana Park", attendees: "30", notes: "Quarterly fire safety refresher" },
  { date: "2026-05-28", topic: "PPE Compliance", facilitator: "Sarah Adeyemi", attendees: "22", notes: "Spot checks planned for next week" },
];

const incidents = [
  { id: "INC-001", date: "2026-05-15", type: "Near Miss" as const, description: "Falling tool from scaffolding — no injury", person: "N/A", wp: "WP-003", rootCause: "Tool lanyard not used", correctiveAction: "Retrain crew on tool tethering", status: "Closed" as const },
  { id: "INC-002", date: "2026-05-19", type: "First Aid" as const, description: "Minor cut from rebar tie wire", person: "James Okafor", wp: "WP-003", rootCause: "Gloves not worn", correctiveAction: "Issued warning; PPE reminder", status: "Closed" as const },
  { id: "INC-003", date: "2026-05-26", type: "Near Miss" as const, description: "Excavation edge collapse near worker", person: "N/A", wp: "WP-001", rootCause: "Inadequate shoring", correctiveAction: "Stop work; install trench box; re-inspect", status: "Open" as const },
];

const incidentTypeColor: Record<string, string> = {
  "Near Miss": "bg-amber-100 text-amber-700",
  "First Aid": "bg-yellow-100 text-yellow-700",
  "LTI": "bg-red-100 text-red-700",
  "Fatality": "bg-red-900 text-white",
};

const incStatusColor: Record<string, string> = {
  "Open": "bg-red-100 text-red-700",
  "Under Investigation": "bg-blue-100 text-blue-700",
  "Closed": "bg-green-100 text-green-700",
};

const permits = [
  { type: "Hot Work", issuedTo: "Steel Fixers United", area: "Basement B2 — welding", dateIssued: "2026-05-20", expiry: "2026-05-27", status: "Active" as const },
  { type: "Work at Height", issuedTo: "Alhaji Masonry Services", area: "Scaffolding — Floor 1", dateIssued: "2026-05-18", expiry: "2026-05-25", status: "Expired" as const },
  { type: "Excavation", issuedTo: "JBN Construction", area: "Trench — Grid A", dateIssued: "2026-05-22", expiry: "2026-06-05", status: "Active" as const },
  { type: "Confined Space", issuedTo: "MEP Team", area: "Basement B2 — sump pit", dateIssued: "2026-05-10", expiry: "2026-05-17", status: "Closed" as const },
];

const permitStatusColor: Record<string, string> = {
  "Active": "bg-green-100 text-green-700",
  "Expired": "bg-red-100 text-red-700",
  "Closed": "bg-gray-100 text-gray-600",
};

const audits = [
  { date: "2026-05-18", area: "Site-wide", auditor: "Diana Park", finding: "PPE compliance 94%; 3 violations noted", severity: "Low" as const, responsible: "Foreman", targetClose: "2026-05-25", status: "Closed" as const },
  { date: "2026-05-21", area: "Scaffolding — East Wing", auditor: "James Okafor", finding: "Missing guardrails on level 2 platform", severity: "High" as const, responsible: "Alhaji Masonry", targetClose: "2026-05-24", status: "Open" as const },
  { date: "2026-05-24", area: "Chemical Storage", auditor: "Sarah Adeyemi", finding: "Incomplete SDS register", severity: "Medium" as const, responsible: "Store Keeper", targetClose: "2026-06-01", status: "In Progress" as const },
];

const severityColor: Record<string, string> = {
  "Low": "bg-green-100 text-green-700",
  "Medium": "bg-amber-100 text-amber-700",
  "High": "bg-red-100 text-red-700",
};

const auditStatusColor: Record<string, string> = {
  "Open": "bg-red-100 text-red-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Closed": "bg-green-100 text-green-700",
};

const drills = [
  { type: "Fire Evacuation", date: "2026-04-15", participants: "45", outcome: "Evacuation complete in 4:30 min (target 5:00)", lessonsLearned: "Stairwell signage needs improvement" },
  { type: "First Aid Response", date: "2026-03-20", participants: "12", outcome: "All first aiders demonstrated correct CPR technique", lessonsLearned: "AED refresher needed for 3 staff" },
  { type: "Spill Containment", date: "2026-05-10", participants: "8", outcome: "Chemical spill simulated; response team activated within 3 min", lessonsLearned: "Spill kit location should be better marked" },
];

const hseColor: Record<string, string> = {
  "Valid": "bg-green-100 text-green-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  "Expired": "bg-red-100 text-red-700",
};

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

export function HSEPage() {
  const { id } = useParams();
  const project = id ? getProjectById(id) : undefined;
  const [activeTab, setActiveTab] = useState<HSETab>("toolbox");

  const matrixData = hseMatrix.filter(m => m.projectId === id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Health, Safety & Environment</h1>
        <p className="text-sm text-gray-500 mt-0.5">{project ? project.name : "HSE management"}</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 flex-wrap">
        {subTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbox Talks */}
      {activeTab === "toolbox" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Toolbox Talks</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> Add Talk
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Date", "Topic", "Facilitator", "Attendees", "Notes"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {toolboxTalks.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{fmtDate(t.date)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{t.topic}</td>
                    <td className="px-4 py-3 text-gray-600">{t.facilitator}</td>
                    <td className="px-4 py-3 text-gray-600">{t.attendees}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[240px] truncate">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Log */}
      {activeTab === "incidents" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Incident Log</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> Report Incident
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Incident ID", "Date", "Type", "Description", "Person", "Work Package", "Root Cause", "Corrective Action", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-orange-600 font-medium">{inc.id}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(inc.date)}</td>
                    <td className="px-4 py-3"><Badge label={inc.type} className={incidentTypeColor[inc.type]} /></td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{inc.description}</td>
                    <td className="px-4 py-3 text-gray-600">{inc.person}</td>
                    <td className="px-4 py-3 text-gray-600">{inc.wp}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{inc.rootCause}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{inc.correctiveAction}</td>
                    <td className="px-4 py-3"><Badge label={inc.status} className={incStatusColor[inc.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permits to Work */}
      {activeTab === "permits" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Permits to Work</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> Issue Permit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Permit Type", "Issued To", "Area", "Date Issued", "Expiry", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permits.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Badge label={p.type} className="bg-blue-50 text-blue-700" /></td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{p.issuedTo}</td>
                    <td className="px-4 py-3 text-gray-600">{p.area}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.dateIssued)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.expiry)}</td>
                    <td className="px-4 py-3"><Badge label={p.status} className={permitStatusColor[p.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HSE Audits & Inspections */}
      {activeTab === "audits" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">HSE Audits & Inspections</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> New Audit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Date", "Area", "Auditor", "Finding", "Severity", "Responsible", "Target Close", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{a.area}</td>
                    <td className="px-4 py-3 text-gray-600">{a.auditor}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[240px] truncate">{a.finding}</td>
                    <td className="px-4 py-3"><Badge label={a.severity} className={severityColor[a.severity]} /></td>
                    <td className="px-4 py-3 text-gray-600">{a.responsible}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(a.targetClose)}</td>
                    <td className="px-4 py-3"><Badge label={a.status} className={auditStatusColor[a.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emergency Drills */}
      {activeTab === "drills" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Emergency Drills</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> Schedule Drill
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Drill Type", "Date", "Participants", "Outcome", "Lessons Learned"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drills.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Badge label={d.type} className="bg-purple-50 text-purple-700" /></td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(d.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.participants}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[280px] truncate">{d.outcome}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate">{d.lessonsLearned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HSE Competency Matrix */}
      {activeTab === "competency" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">HSE Competency Matrix</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
              <Plus className="w-3.5 h-3.5" /> Add Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Staff", "Competency", "Date Obtained", "Expiry", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matrixData.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No competency records for this project</td></tr>
                ) : matrixData.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{m.staffMember}</td>
                    <td className="px-4 py-3 text-gray-600">{m.competency}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(m.dateObtained)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(m.expiryDate)}</td>
                    <td className="px-4 py-3"><Badge label={m.status} className={hseColor[m.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
