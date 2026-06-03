import { useState } from "react";
import { Plus, X, Edit3, Save, CheckCircle, Building2, Users, Layers, Archive, Shield, BookOpen, UserPlus } from "lucide-react";

interface OrgLevel {
  id: string; name: string; description: string; members: number; archived: boolean;
}
interface SupportingStructure {
  id: string; name: string; type: "craft" | "circle"; description: string; members: number;
}

export function OrgStructurePage() {
  const [saved, setSaved] = useState(false);
  const [levelNames, setLevelNames] = useState({ l1: "Collegium", l2: "Cluster", l3: "Crew" });

  const [collegiums, setCollegiums] = useState<OrgLevel[]>([
    { id: "col-1", name: "Executive Collegium", description: "Strategic leadership and governance", members: 7, archived: false },
    { id: "col-2", name: "Technical Collegium", description: "Technical oversight and standards", members: 5, archived: false },
  ]);
  const [clusters, setClusters] = useState<OrgLevel[]>([
    { id: "cl-1", name: "Lagos Operations", description: "Lagos metro area projects", members: 45, archived: false },
    { id: "cl-2", name: "Abuja Operations", description: "Federal capital territory projects", members: 28, archived: false },
    { id: "cl-3", name: "Rivers Operations", description: "South-south region projects", members: 22, archived: false },
  ]);
  const [crews, setCrews] = useState<OrgLevel[]>([
    { id: "cr-1", name: "Tower A Site Crew", description: "Lekki Tower A execution team", members: 12, archived: false },
    { id: "cr-2", name: "Finishing Crew", description: "Interior finishing specialists", members: 8, archived: false },
    { id: "cr-3", name: "MEP Crew", description: "Mechanical, electrical, plumbing", members: 6, archived: false },
  ]);

  const [crafts, setCrafts] = useState<SupportingStructure[]>([
    { id: "sk-1", name: "Engineering", type: "craft", description: "Civil, structural, MEP engineers", members: 34 },
    { id: "sk-2", name: "Quantity Surveying", type: "craft", description: "Cost management and estimation", members: 18 },
    { id: "sk-3", name: "Safety Officers", type: "craft", description: "HSE professionals", members: 12 },
  ]);
  const [circles, setCircles] = useState<SupportingStructure[]>([
    { id: "ci-1", name: "Leadership Development", type: "circle", description: "Future leaders mentorship program", members: 15 },
    { id: "ci-2", name: "Technical Excellence", type: "circle", description: "Technical skills development", members: 22 },
  ]);

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");
  const [addingTo, setAddingTo] = useState<"collegium" | "cluster" | "crew" | null>(null);

  const [newCraftName, setNewCraftName] = useState("");
  const [newCraftDesc, setNewCraftDesc] = useState("");
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");

  const [editLevel, setEditLevel] = useState<"l1" | "l2" | "l3" | null>(null);
  const [editLevelVal, setEditLevelVal] = useState("");

  function save() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

  function addOrgLevel(type: "collegium" | "cluster" | "crew") {
    if (!newOrgName.trim()) return;
    const item: OrgLevel = { id: `${type}-${Date.now()}`, name: newOrgName.trim(), description: newOrgDesc.trim(), members: 0, archived: false };
    if (type === "collegium") setCollegiums(p => [...p, item]);
    else if (type === "cluster") setClusters(p => [...p, item]);
    else setCrews(p => [...p, item]);
    setNewOrgName(""); setNewOrgDesc(""); setAddingTo(null);
  }

  function archiveOrg(type: "collegium" | "cluster" | "crew", id: string) {
    const toggle = (items: OrgLevel[]) => items.map(i => i.id === id ? { ...i, archived: !i.archived } : i);
    if (type === "collegium") setCollegiums(toggle);
    else if (type === "cluster") setClusters(toggle);
    else setCrews(toggle);
  }

  function addSupporting(type: "craft" | "circle") {
    const name = type === "craft" ? newCraftName : newCircleName;
    const desc = type === "craft" ? newCraftDesc : newCircleDesc;
    if (!name.trim()) return;
    const item: SupportingStructure = { id: `${type}-${Date.now()}`, name: name.trim(), type, description: desc.trim(), members: 0 };
    if (type === "craft") setCrafts(p => [...p, item]);
    else setCircles(p => [...p, item]);
    if (type === "craft") { setNewCraftName(""); setNewCraftDesc(""); }
    else { setNewCircleName(""); setNewCircleDesc(""); }
  }

  const LevelCard = ({ item, type }: { item: OrgLevel; type: "collegium" | "cluster" | "crew" }) => (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${item.archived ? "bg-gray-50 opacity-60" : "bg-white"}`} style={{ borderColor: "#E2E8F0" }}>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${item.archived ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.name}</p>
        <p className="text-xs text-gray-500 truncate">{item.description} · {item.members} members</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button onClick={() => archiveOrg(type, item.id)} className={`p-1 rounded ${item.archived ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`} title={item.archived ? "Restore" : "Archive"}>
          <Archive className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organizational Structure</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your organization hierarchy and supporting structures</p>
        </div>
        <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Level Naming */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-indigo-600" /> Organizational Level Names
        </h2>
        <p className="text-xs text-gray-400 mb-4">Customize the names used for each level in your organizational hierarchy</p>
        <div className="grid grid-cols-3 gap-4">
          {(["l1", "l2", "l3"] as const).map((level) => (
            <div key={level} className="border border-gray-200 rounded-lg p-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Level {level[1]}</label>
              {editLevel === level ? (
                <div className="flex items-center gap-1">
                  <input value={editLevelVal} onChange={e => setEditLevelVal(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { setLevelNames(p => ({ ...p, [level]: editLevelVal })); setEditLevel(null); } }} />
                  <button onClick={() => { setLevelNames(p => ({ ...p, [level]: editLevelVal })); setEditLevel(null); }} className="p-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{levelNames[level]}</span>
                  <button onClick={() => { setEditLevel(level); setEditLevelVal(levelNames[level]); }} className="p-1 text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                {level === "l1" ? "Executive leadership body" : level === "l2" ? "Operational management level" : "Execution-level teams"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchy Sections */}
      {[
        { key: "collegium" as const, label: levelNames.l1, icon: Building2, color: "indigo", items: collegiums, desc: "Leadership bodies overseeing strategy and governance" },
        { key: "cluster" as const, label: levelNames.l2, icon: Users, color: "purple", items: clusters, desc: "Operational units managing related projects and regions" },
        { key: "crew" as const, label: levelNames.l3, icon: Users, color: "orange", items: crews, desc: "Execution-level teams performing project work" },
      ].map(section => (
        <div key={section.key} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <section.icon className={`w-4 h-4 text-${section.color}-600`} /> {section.label}s
            </h2>
            <button onClick={() => setAddingTo(section.key)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
              <Plus className="w-3 h-3" /> Add {section.label}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">{section.desc}</p>
          <div className="space-y-2">
            {section.items.filter(i => !i.archived).map(item => <LevelCard key={item.id} item={item} type={section.key} />)}
            {section.items.filter(i => i.archived).length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium mt-3 mb-1">Archived</p>
                {section.items.filter(i => i.archived).map(item => <LevelCard key={item.id} item={item} type={section.key} />)}
              </>
            )}
            {section.items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No {section.label.toLowerCase()}s configured</p>}
          </div>
        </div>
      ))}

      {/* Add Org Level Modal */}
      {addingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl w-full max-w-md p-5" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Add {levelNames[addingTo === "collegium" ? "l1" : addingTo === "cluster" ? "l2" : "l3"]}</h3>
              <button onClick={() => setAddingTo(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Lagos Operations" style={{ borderColor: "#E2E8F0" }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={newOrgDesc} onChange={e => setNewOrgDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Brief description" style={{ borderColor: "#E2E8F0" }} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setAddingTo(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancel</button>
              <button onClick={() => addOrgLevel(addingTo)} disabled={!newOrgName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium disabled:opacity-40 hover:bg-indigo-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Structures */}
      <div className="grid grid-cols-2 gap-5">
        {/* Crafts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-emerald-600" /> Crafts
          </h2>
          <p className="text-xs text-gray-400 mb-3">Cross-functional professional groups for knowledge sharing and standardization</p>
          <div className="space-y-2 mb-3">
            {crafts.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0" }}>
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.description} · {c.members} members</p>
                </div>
              </div>
            ))}
            {crafts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No crafts configured</p>}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input value={newCraftName} onChange={e => setNewCraftName(e.target.value)} placeholder="Craft name..." className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <input value={newCraftDesc} onChange={e => setNewCraftDesc(e.target.value)} placeholder="Description..." className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button onClick={() => addSupporting("craft")} disabled={!newCraftName.trim()} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium disabled:opacity-40 hover:bg-emerald-700"><Plus className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Circles */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-amber-600" /> Circles
          </h2>
          <p className="text-xs text-gray-400 mb-3">Learning and collaboration communities for mentorship and development</p>
          <div className="space-y-2 mb-3">
            {circles.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0" }}>
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.description} · {c.members} members</p>
                </div>
              </div>
            ))}
            {circles.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No circles configured</p>}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input value={newCircleName} onChange={e => setNewCircleName(e.target.value)} placeholder="Circle name..." className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <input value={newCircleDesc} onChange={e => setNewCircleDesc(e.target.value)} placeholder="Description..." className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button onClick={() => addSupporting("circle")} disabled={!newCircleName.trim()} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium disabled:opacity-40 hover:bg-amber-700"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      {/* Contractor Supervisor Support */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
          <UserPlus className="w-4 h-4 text-indigo-600" /> Contractor Supervisors
        </h2>
        <p className="text-xs text-gray-400 mb-3">External supervisor records for project workforce management (no payroll linkage required)</p>
        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Contractor supervisors can be attached to <strong>{levelNames.l3}s</strong> and participate in project execution without requiring employee records or payroll linkage.</span>
        </div>
      </div>
    </div>
  );
}
