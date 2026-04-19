import { useState } from "react";
import {
  Building2, Plus, Search, Edit, Trash2, Users, ChevronDown, ChevronRight, X,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  head: string;
  headId: string;
  description: string;
  headcount: number;
  budget: string;
  location: string;
  employees: { name: string; role: string; id: string }[];
}

const initialDepts: Department[] = [
  { id: "DEPT-001", name: "Engineering", head: "Chukwudi Eze", headId: "EMP-001", description: "Site engineers, structural engineers, MEP specialists, and construction supervision staff.", headcount: 28, budget: "₦45M / yr", location: "Abuja, Lagos", employees: [
    { name: "Chukwudi Eze", role: "Site Engineer", id: "EMP-001" },
    { name: "Robert Lee", role: "Structural Engineer", id: "EMP-003" },
    { name: "Mike Davis", role: "Site Foreman", id: "EMP-005" },
    { name: "Ngozi Eze", role: "Site Supervisor", id: "EMP-008" },
    { name: "Kwame Asante", role: "Civil Engineer", id: "EMP-009" },
    { name: "Lawal Musa", role: "MEP Engineer", id: "EMP-012" },
  ] },
  { id: "DEPT-002", name: "Operations", head: "Aisha Bello", headId: "EMP-002", description: "Project management and overall coordination of construction delivery across all active projects.", headcount: 12, budget: "₦18M / yr", location: "Abuja", employees: [
    { name: "Aisha Bello", role: "Project Manager", id: "EMP-002" },
    { name: "Yemi Olusegun", role: "Project Manager", id: "EMP-015" },
  ] },
  { id: "DEPT-003", name: "Finance", head: "Sarah Johnson", headId: "EMP-004", description: "Financial planning, budgeting, accounts payable/receivable, and reporting for all company operations.", headcount: 8, budget: "₦12M / yr", location: "Lagos", employees: [
    { name: "Sarah Johnson", role: "Accountant", id: "EMP-004" },
    { name: "Funke Adeyemi", role: "Finance Analyst", id: "EMP-013" },
  ] },
  { id: "DEPT-004", name: "Procurement", head: "Tom Fox", headId: "EMP-007", description: "Materials sourcing, vendor management, purchase order processing and inventory control.", headcount: 6, budget: "₦9M / yr", location: "Lagos, Abuja", employees: [
    { name: "Tom Fox", role: "Quantity Surveyor", id: "EMP-007" },
  ] },
  { id: "DEPT-005", name: "Human Resources", head: "Alice Ware", headId: "EMP-006", description: "Recruitment, onboarding, employee relations, payroll coordination, and HR policy management.", headcount: 5, budget: "₦7.5M / yr", location: "Lagos", employees: [
    { name: "Alice Ware", role: "HR Officer", id: "EMP-006" },
  ] },
  { id: "DEPT-006", name: "Health & Safety", head: "Emeka Nwosu", headId: "EMP-010", description: "HSE compliance, safety audits, incident reporting, and ensuring OSHA standards across all sites.", headcount: 4, budget: "₦6M / yr", location: "All Sites", employees: [
    { name: "Emeka Nwosu", role: "HSE Officer", id: "EMP-010" },
  ] },
  { id: "DEPT-007", name: "Administration", head: "Bisi Akinola", headId: "EMP-011", description: "General administration, facilities management, office operations, and executive support.", headcount: 4, budget: "₦5M / yr", location: "Lagos", employees: [
    { name: "Bisi Akinola", role: "Admin Officer", id: "EMP-011" },
  ] },
  { id: "DEPT-008", name: "IT & Systems", head: "David Obi", headId: "EMP-014", description: "Internal IT infrastructure, ERP system management, software support, and cybersecurity.", headcount: 3, budget: "₦8M / yr", location: "Lagos", employees: [
    { name: "David Obi", role: "IT Officer", id: "EMP-014" },
  ] },
];

const deptColors = [
  "bg-indigo-100 text-indigo-700", "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700", "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700", "bg-teal-100 text-teal-700",
];

export function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newHead, setNewHead] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const filtered = initialDepts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.head.toLowerCase().includes(search.toLowerCase())
  );

  const total = initialDepts.reduce((s, d) => s + d.headcount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{initialDepts.length} departments · {total} total employees</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800">
          <Plus className="w-3.5 h-3.5" /> Add Department
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Departments", value: initialDepts.length, color: "text-indigo-700", bg: "bg-indigo-50" },
          { label: "Total Headcount", value: total, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Largest Dept", value: "Engineering (28)", color: "text-green-700", bg: "bg-green-50" },
          { label: "Total Budget", value: "₦110.5M / yr", color: "text-amber-700", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-4`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search departments..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Department cards */}
      <div className="space-y-3">
        {filtered.map((dept, i) => {
          const isOpen = expanded === dept.id;
          return (
            <div key={dept.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isOpen ? null : dept.id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${deptColors[i % deptColors.length]}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-500">Head: {dept.head} · {dept.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{dept.headcount}</p>
                    <p className="text-xs text-gray-400">Employees</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{dept.budget}</p>
                    <p className="text-xs text-gray-400">Budget</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" onClick={e => e.stopPropagation()}><Edit className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5" /></button>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Department Members ({dept.employees.length} shown)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {dept.employees.map(e => (
                        <div key={e.id} className="bg-white rounded border border-gray-200 px-3 py-2">
                          <p className="text-sm font-medium text-gray-800">{e.name}</p>
                          <p className="text-xs text-gray-400">{e.role} · {e.id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Add Department</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Department Name", value: newName, set: setNewName, ph: "e.g. Engineering" },
                { label: "Department Head", value: newHead, set: setNewHead, ph: "e.g. Chukwudi Eze" },
                { label: "Work Location", value: newLocation, set: setNewLocation, ph: "e.g. Abuja, Lagos" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800">Create Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
