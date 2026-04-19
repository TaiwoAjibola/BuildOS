import { useState } from "react";
import { Mail, Phone, Briefcase, Building2, User, Calendar, Shield } from "lucide-react";

interface ProfileField { label: string; value: string; icon?: React.ReactNode; editable?: boolean; }

const personalFields: ProfileField[] = [
  { label: "Full Name",     value: "James Okafor",            icon: <User       className="w-4 h-4 text-gray-400" />, editable: true  },
  { label: "Phone",         value: "+234 801 234 5678",        icon: <Phone      className="w-4 h-4 text-gray-400" />, editable: true  },
  { label: "Email",         value: "j.okafor@buildos.ng",      icon: <Mail       className="w-4 h-4 text-gray-400" />, editable: false },
];

const employmentFields: ProfileField[] = [
  { label: "Employee ID",      value: "EMP-0024",          icon: <Shield     className="w-4 h-4 text-gray-400" /> },
  { label: "Department",       value: "Engineering",       icon: <Building2  className="w-4 h-4 text-gray-400" /> },
  { label: "Role",             value: "Site Engineer",     icon: <Briefcase  className="w-4 h-4 text-gray-400" /> },
  { label: "Hire Date",        value: "March 3, 2023",     icon: <Calendar   className="w-4 h-4 text-gray-400" /> },
  { label: "Manager",          value: "Michael Chen",      icon: <User       className="w-4 h-4 text-gray-400" /> },
  { label: "Employment Type",  value: "Full-time",         icon: <Briefcase  className="w-4 h-4 text-gray-400" /> },
];

export function MyProfilePage() {
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(phone);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setPhone(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your personal and employment details</p>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full" /> Phone number updated.
        </div>
      )}

      {/* Avatar + Name banner */}
      <div className="bg-linear-to-r from-teal-600 to-teal-700 rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
          JO
        </div>
        <div>
          <p className="text-white text-xl font-semibold">James Okafor</p>
          <p className="text-teal-100 text-sm">Site Engineer · Engineering Department</p>
          <p className="text-teal-200 text-xs mt-0.5">EMP-0024 · Joined March 2023</p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Personal Information</h2>
          {!editing && (
            <button onClick={() => { setDraft(phone); setEditing(true); }}
              className="text-xs font-medium text-teal-600 hover:text-teal-800 border border-teal-200 px-3 py-1 rounded-md">
              Edit Phone
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {personalFields.map(f => (
            <div key={f.label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-5 flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                {f.label === "Phone" && editing ? (
                  <div className="flex items-center gap-2">
                    <input value={draft} onChange={e => setDraft(e.target.value)}
                      className="border border-teal-400 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48" />
                    <button onClick={handleSave} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700">Save</button>
                    <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{f.label === "Phone" ? phone : f.value}</p>
                )}
              </div>
              {!f.editable && <span className="text-xs text-gray-300 italic">read-only</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Employment Details</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {employmentFields.map(f => (
            <div key={f.label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-5 flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-gray-600">{f.value}</p>
              </div>
              <span className="text-xs text-gray-300 italic">read-only</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <p className="text-xs text-gray-400">To update employment details, contact HR at <span className="text-teal-600 font-medium">hr@buildos.ng</span></p>
        </div>
      </div>
    </div>
  );
}
