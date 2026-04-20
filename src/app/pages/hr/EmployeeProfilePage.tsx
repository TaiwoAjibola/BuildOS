import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, BadgeCheck,
  Briefcase, FileText, Clock, DollarSign, Activity, Edit, Download,
  CheckCircle, XCircle, UserCheck, AlertCircle, X, Save,
} from "lucide-react";

type TabId = "personal" | "employment" | "projects" | "documents" | "attendance" | "payroll" | "activity";

const allEmployees: Record<string, {
  id: string; firstName: string; lastName: string; role: string; department: string; status: string;
  email: string; phone: string; dateHired: string; employmentType: string; reportingTo: string;
  address: string; dob: string; gender: string; nationality: string; emergencyContact: string;
  salary: string; gradeLevel: string; workLocation: string; skills: string[];
  projects: { name: string; role: string; allocPct: number; startDate: string; status: string }[];
  docs: { name: string; type: string; uploaded: string; size: string }[];
  attendance: { date: string; checkIn: string; checkOut: string; status: string; hrs: number }[];
  payroll: { month: string; gross: string; deductions: string; net: string; status: string }[];
  activity: { date: string; action: string; by: string }[];
}> = {
  "EMP-001": {
    id: "EMP-001", firstName: "Chukwudi", lastName: "Eze",
    role: "Site Engineer", department: "Engineering", status: "active",
    email: "c.eze@buildos.ng", phone: "+234 80 1234 5678", dateHired: "Jan 15, 2023",
    employmentType: "Full-time", reportingTo: "Aisha Bello (EMP-002)",
    address: "14B Ogui Road, Enugu State, Nigeria", dob: "Aug 22, 1990",
    gender: "Male", nationality: "Nigerian",
    emergencyContact: "Obioma Eze — +234 80 9876 5432 (Spouse)",
    salary: "₦320,000 / month", gradeLevel: "Level 7 (Senior Engineer)", workLocation: "Site – Abuja",
    skills: ["Structural Analysis", "AutoCAD", "Civil 3D", "Project Scheduling", "Quality Inspection"],
    projects: [
      { name: "Downtown Office Complex", role: "Lead Site Engineer", allocPct: 50, startDate: "Feb 2023", status: "active" },
      { name: "Highway Interchange", role: "Support Engineer", allocPct: 30, startDate: "Jun 2023", status: "active" },
      { name: "Industrial Warehouse", role: "Inspection Lead", allocPct: 20, startDate: "Jan 2024", status: "active" },
    ],
    docs: [
      { name: "Employment Contract.pdf", type: "Contract", uploaded: "Jan 15, 2023", size: "340 KB" },
      { name: "COREN Certification.pdf", type: "Professional Cert", uploaded: "Jan 15, 2023", size: "210 KB" },
      { name: "BSc Civil Engineering.pdf", type: "Degree Certificate", uploaded: "Jan 15, 2023", size: "1.2 MB" },
      { name: "Performance Review Q1 2025.pdf", type: "Review", uploaded: "Apr 12, 2025", size: "98 KB" },
    ],
    attendance: [
      { date: "Mon, Apr 28 2025", checkIn: "07:48 AM", checkOut: "05:10 PM", status: "present", hrs: 9.4 },
      { date: "Fri, Apr 25 2025", checkIn: "07:55 AM", checkOut: "05:00 PM", status: "present", hrs: 9.1 },
      { date: "Thu, Apr 24 2025", checkIn: "09:45 AM", checkOut: "05:00 PM", status: "late", hrs: 7.25 },
      { date: "Wed, Apr 23 2025", checkIn: "07:50 AM", checkOut: "05:05 PM", status: "present", hrs: 9.25 },
      { date: "Tue, Apr 22 2025", checkIn: "—", checkOut: "—", status: "absent", hrs: 0 },
      { date: "Mon, Apr 21 2025", checkIn: "07:45 AM", checkOut: "05:00 PM", status: "present", hrs: 9.25 },
    ],
    payroll: [
      { month: "April 2025", gross: "₦320,000", deductions: "₦48,000", net: "₦272,000", status: "paid" },
      { month: "March 2025", gross: "₦320,000", deductions: "₦48,000", net: "₦272,000", status: "paid" },
      { month: "February 2025", gross: "₦320,000", deductions: "₦48,000", net: "₦272,000", status: "paid" },
      { month: "January 2025", gross: "₦320,000", deductions: "₦48,000", net: "₦272,000", status: "paid" },
    ],
    activity: [
      { date: "Apr 28, 2025 – 08:01", action: "Clock-in recorded (07:48 AM)", by: "System" },
      { date: "Apr 25, 2025 – 10:22", action: "Assigned to Industrial Warehouse as Inspection Lead", by: "Aisha Bello" },
      { date: "Apr 12, 2025 – 14:55", action: "Performance Review Q1 2025 uploaded", by: "Alice Ware (HR)" },
      { date: "Mar 01, 2025 – 09:00", action: "March 2025 payroll processed – ₦272,000 net", by: "Finance System" },
      { date: "Jan 15, 2023 – 08:00", action: "Employee record created. Employment started.", by: "HR Admin" },
    ],
  },
};

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal Info", icon: <BadgeCheck className="w-4 h-4" /> },
  { id: "employment", label: "Employment", icon: <Briefcase className="w-4 h-4" /> },
  { id: "projects", label: "Projects", icon: <Building2 className="w-4 h-4" /> },
  { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
  { id: "attendance", label: "Attendance", icon: <Clock className="w-4 h-4" /> },
  { id: "payroll", label: "Payroll", icon: <DollarSign className="w-4 h-4" /> },
  { id: "activity", label: "Activity Log", icon: <Activity className="w-4 h-4" /> },
];

const statusConfig: Record<string, { label: string; badge: string }> = {
  active: { label: "Active", badge: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", badge: "bg-red-100 text-red-700" },
  on_leave: { label: "On Leave", badge: "bg-amber-100 text-amber-700" },
};

const attendanceBadge: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
};

export function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("personal");
  const [editOpen, setEditOpen] = useState(false);
  const [empData, setEmpData] = useState(allEmployees);

  const emp = empData[id ?? ""] ?? empData["EMP-001"];
  const empKey = id && empData[id] ? id : "EMP-001";

  const [editDraft, setEditDraft] = useState({ ...emp });

  function openEdit() {
    setEditDraft({ ...empData[empKey] });
    setEditOpen(true);
  }

  function saveEdit() {
    setEmpData(prev => ({ ...prev, [empKey]: { ...editDraft } }));
    setEditOpen(false);
  }

  function df(key: keyof typeof editDraft, value: string) {
    setEditDraft(prev => ({ ...prev, [key]: value }));
  }

  const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
  const statusCfg = statusConfig[emp.status] ?? statusConfig.active;
  const avatarColors = ["bg-indigo-100 text-indigo-700", "bg-blue-100 text-blue-700", "bg-green-100 text-green-700"];
  const avColor = avatarColors[parseInt(emp.id.slice(-3)) % avatarColors.length];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/apps/hr")} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${avColor}`}>{initials}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{emp.firstName} {emp.lastName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.badge}`}>{statusCfg.label}</span>
            </div>
            <p className="text-sm text-gray-500">{emp.role} · {emp.department}</p>
            <p className="text-xs text-gray-400 font-mono">{emp.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export Profile
          </button>
          <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800">
            <Edit className="w-3.5 h-3.5" /> Edit Employee
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 whitespace-nowrap ${tab === t.id ? "border-indigo-600 text-indigo-700 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Info */}
      {tab === "personal" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Personal Details</h3>
            {[
              { label: "Full Name", value: `${emp.firstName} ${emp.lastName}`, icon: <BadgeCheck className="w-4 h-4 text-indigo-500" /> },
              { label: "Date of Birth", value: emp.dob, icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
              { label: "Gender", value: emp.gender, icon: <BadgeCheck className="w-4 h-4 text-indigo-500" /> },
              { label: "Nationality", value: emp.nationality, icon: <MapPin className="w-4 h-4 text-indigo-500" /> },
              { label: "Address", value: emp.address, icon: <MapPin className="w-4 h-4 text-indigo-500" /> },
            ].map(r => (
              <div key={r.label} className="flex items-start gap-3">
                <div className="mt-0.5">{r.icon}</div>
                <div>
                  <p className="text-xs text-gray-400">{r.label}</p>
                  <p className="text-sm font-medium text-gray-800">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Contact Details</h3>
              {[
                { label: "Email", value: emp.email, icon: <Mail className="w-4 h-4 text-indigo-500" /> },
                { label: "Phone", value: emp.phone, icon: <Phone className="w-4 h-4 text-indigo-500" /> },
                { label: "Emergency Contact", value: emp.emergencyContact, icon: <AlertCircle className="w-4 h-4 text-amber-500" /> },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="mt-0.5">{r.icon}</div>
                  <div><p className="text-xs text-gray-400">{r.label}</p><p className="text-sm font-medium text-gray-800">{r.value}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Core Skills</h3>
              <div className="flex flex-wrap gap-2">
                {emp.skills.map(s => <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employment */}
      {tab === "employment" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Employment Details</h3>
            {[
              { label: "Employee ID", value: emp.id },
              { label: "Job Title / Role", value: emp.role },
              { label: "Department", value: emp.department },
              { label: "Grade Level", value: emp.gradeLevel },
              { label: "Employment Type", value: emp.employmentType },
              { label: "Work Location", value: emp.workLocation },
              { label: "Reports To", value: emp.reportingTo },
              { label: "Date Hired", value: emp.dateHired },
              { label: "Monthly Salary", value: emp.salary },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-sm font-medium text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Employment Status</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${statusCfg.badge}`}>
              <CheckCircle className="w-4 h-4" />{statusCfg.label}
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      {tab === "projects" && (
        <div className="space-y-3">
          {emp.projects.map(p => (
            <div key={p.name} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.role} · Started {p.startDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-indigo-700">{p.allocPct}%</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded capitalize">{p.status}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${p.allocPct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {tab === "documents" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-800">{emp.docs.length} Documents on File</h3>
            <button className="text-sm text-indigo-700 hover:underline">+ Upload Document</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Document Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Uploaded</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Size</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {emp.docs.map(d => (
                <tr key={d.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" />{d.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.type}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.uploaded}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.size}</td>
                  <td className="px-4 py-3"><button className="text-xs text-indigo-600 hover:underline">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance */}
      {tab === "attendance" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 text-sm">Recent Attendance History</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Check In</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Check Out</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Hours</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {emp.attendance.map(a => (
                <tr key={a.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{a.date}</td>
                  <td className="px-4 py-3 text-gray-500">{a.checkIn}</td>
                  <td className="px-4 py-3 text-gray-500">{a.checkOut}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${attendanceBadge[a.status]}`}>{a.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{a.hrs > 0 ? `${a.hrs}h` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payroll */}
      {tab === "payroll" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 text-sm">Payroll History</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Month</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Gross Pay</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Deductions</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Net Pay</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {emp.payroll.map(p => (
                <tr key={p.month} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.month}</td>
                  <td className="px-4 py-3 text-gray-700">{p.gross}</td>
                  <td className="px-4 py-3 text-red-500">-{p.deductions}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{p.net}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 text-sm mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {emp.activity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-gray-800">{a.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.date} · by {a.by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Edit Employee — {emp.id}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update employment and personal details. Signature is managed by the employee.</p>
              </div>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input value={editDraft.firstName} onChange={e => df("firstName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input value={editDraft.lastName} onChange={e => df("lastName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input value={editDraft.email} onChange={e => df("email", e.target.value)} type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={editDraft.phone} onChange={e => df("phone", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Role / Dept */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title / Role</label>
                  <input value={editDraft.role} onChange={e => df("role", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <input value={editDraft.department} onChange={e => df("department", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Employment details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
                  <select value={editDraft.employmentType} onChange={e => df("employmentType", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {["Full-time", "Part-time", "Contract", "Intern", "Consultant"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={editDraft.status} onChange={e => df("status", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade Level</label>
                  <input value={editDraft.gradeLevel} onChange={e => df("gradeLevel", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Work Location</label>
                  <input value={editDraft.workLocation} onChange={e => df("workLocation", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Salary (₦)</label>
                  <input value={editDraft.salary} onChange={e => df("salary", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reports To</label>
                  <input value={editDraft.reportingTo} onChange={e => df("reportingTo", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input value={editDraft.address} onChange={e => df("address", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Emergency Contact</label>
                <input value={editDraft.emergencyContact} onChange={e => df("emergencyContact", e.target.value)}
                  placeholder="Name — phone (Relationship)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Signature is <strong>not editable here</strong> — employees manage their own signature via the ESS portal.
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit}
                className="px-4 py-2 text-sm bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
