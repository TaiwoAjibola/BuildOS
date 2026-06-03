import { useState } from "react";
import { Settings, Save, Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Tags, Layers, Sun, Truck, Building2, Users, Package, UserCog, ExternalLink, ArrowRight } from "lucide-react";
import type { Sector, ScheduleLevelConfig, WeatherConfig } from "./types";
import { defaultScheduleLevels, defaultWeatherConfig, defaultProjectTypes } from "./mockData";

const defaultTradeTypes = [
  "Masonry", "Concreting labor", "Carpentry (formwork)", "Carpentry (roofing)",
  "Iron benders / steel fixers", "Tiling", "Plumbing", "Electrical",
  "Painting", "Glazing / aluminum works", "General operations / laboring",
  "Equipment operation", "Scaffolding", "Welding",
];

interface ReportSetting { id: string; key: string; label: string; enabled: boolean; }

const defaultReportSettings: ReportSetting[] = [
  { id: "rs1", key: "auto_generate_weekly", label: "Auto-generate weekly progress report", enabled: true },
  { id: "rs2", key: "rag_summary", label: "Include RAG summary in reports", enabled: true },
  { id: "rs3", key: "cost_breakdown", label: "Include cost breakdown", enabled: true },
  { id: "rs4", key: "resource_performance", label: "Include resource performance metrics", enabled: false },
  { id: "rs5", key: "schedule_gantt", label: "Include schedule Gantt chart", enabled: true },
  { id: "rs6", key: "daily_report_reminder", label: "Daily report submission reminder", enabled: true },
];

export function SettingsPage() {
  const [tradeTypes, setTradeTypes] = useState<string[]>(defaultTradeTypes);
  const [reportSettings, setReportSettings] = useState<ReportSetting[]>(defaultReportSettings);
  const [newTrade, setNewTrade] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Schedule levels

  // Schedule levels
  const [scheduleLevels, setScheduleLevels] = useState<ScheduleLevelConfig[]>(defaultScheduleLevels);

  // Weather config
  const [weatherConfig, setWeatherConfig] = useState<WeatherConfig[]>(defaultWeatherConfig);
  const [newWeather, setNewWeather] = useState("");

  // Project types
  const [projectTypes, setProjectTypes] = useState(defaultProjectTypes);
  const [newSector, setNewSector] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescriptor, setNewDescriptor] = useState("");

  function handleSave() {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  }

  function toggleReportSetting(id: string) {
    setReportSettings(prev => prev.map(rs => rs.id === id ? { ...rs, enabled: !rs.enabled } : rs));
  }

  function addTrade() {
    if (!newTrade.trim() || tradeTypes.includes(newTrade.trim())) return;
    setTradeTypes(prev => [...prev, newTrade.trim()]);
    setNewTrade("");
  }

  function removeTrade(t: string) {
    setTradeTypes(prev => prev.filter(x => x !== t));
  }

  function updateScheduleLevel(idx: number, field: keyof ScheduleLevelConfig, val: string | boolean | number | null) {
    setScheduleLevels(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  }

  function addScheduleLevel() {
    const next = scheduleLevels.length + 1;
    setScheduleLevels(prev => [...prev, { level: next, name: `Level ${next}`, prefix: `L${next}`, canAssignResources: true }]);
  }

  function removeScheduleLevel(idx: number) {
    setScheduleLevels(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleWeather(idx: number) {
    setWeatherConfig(prev => prev.map((w, i) => i === idx ? { ...w, enabled: !w.enabled } : w));
  }

  function addWeather() {
    if (!newWeather.trim()) return;
    const val = newWeather.trim();
    setWeatherConfig(prev => [...prev, { value: val as any, label: val, enabled: true }]);
    setNewWeather("");
  }

  function removeWeather(idx: number) {
    setWeatherConfig(prev => prev.filter((_, i) => i !== idx));
  }

  function addSector() {
    if (!newSector.trim() || projectTypes.some(pt => pt.sector === newSector.trim())) return;
    setProjectTypes(prev => [...prev, { sector: newSector.trim() as Sector, categories: [newCategory.trim() || "General"], descriptors: [] }]);
    setNewSector("");
    setNewCategory("");
  }

  function addDescriptor(sector: string) {
    if (!newDescriptor.trim()) return;
    setProjectTypes(prev => prev.map(pt => pt.sector === sector ? { ...pt, descriptors: [...(pt.descriptors || []), newDescriptor.trim()] } : pt));
    setNewDescriptor("");
  }

  function removeDescriptor(sector: string, desc: string) {
    setProjectTypes(prev => prev.map(pt => pt.sector === sector ? { ...pt, descriptors: (pt.descriptors || []).filter(d => d !== desc) } : pt));
  }

  function removeSector(sector: string) {
    setProjectTypes(prev => prev.filter(pt => pt.sector !== sector));
  }

  function addCategory(sector: string) {
    if (!newCategory.trim()) return;
    setProjectTypes(prev => prev.map(pt => pt.sector === sector ? { ...pt, categories: [...pt.categories, newCategory.trim()] } : pt));
    setNewCategory("");
  }

  function removeCategory(sector: string, cat: string) {
    setProjectTypes(prev => prev.map(pt => pt.sector === sector ? { ...pt, categories: pt.categories.filter(c => c !== cat) } : pt));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Construction module configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${saved ? "bg-green-600 text-white" : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"}`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5">

        {/* ─── Project Types ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Tags className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Project Types</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Configure sectors, categories, and descriptors available during project setup</p>
          <div className="space-y-3">
            {projectTypes.map(pt => (
              <div key={pt.sector} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{pt.sector}</span>
                  <button onClick={() => removeSector(pt.sector)} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Categories</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {pt.categories.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                      {c}
                      <button onClick={() => removeCategory(pt.sector, c)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Add category..." className="flex-1 max-w-xs border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    onKeyDown={e => e.key === "Enter" && addCategory(pt.sector)} />
                  <button onClick={() => addCategory(pt.sector)} disabled={!newCategory.trim()} className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-40"><Plus className="w-3 h-3" /></button>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Descriptors</p>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {(pt.descriptors || []).map(d => (
                    <span key={d} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {d}
                      <button onClick={() => removeDescriptor(pt.sector, d)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input value={newDescriptor} onChange={e => setNewDescriptor(e.target.value)} placeholder="Add descriptor..." className="flex-1 max-w-xs border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    onKeyDown={e => e.key === "Enter" && addDescriptor(pt.sector)} />
                  <button onClick={() => addDescriptor(pt.sector)} disabled={!newDescriptor.trim()} className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-40"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <input value={newSector} onChange={e => setNewSector(e.target.value)} placeholder="New sector name..." className="flex-1 max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button onClick={addSector} disabled={!newSector.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /> Add Sector</button>
          </div>
        </div>

        {/* ─── Schedule Levels ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Schedule Levels</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Configure the task hierarchy levels used in the schedule builder. Each level can have resources assigned.</p>
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 text-xs font-medium text-gray-500 px-3 py-1">
              <span>Level</span> <span>Name</span> <span>Prefix</span> <span>Parent</span> <span>Resources</span>
            </div>
            {scheduleLevels.map((l, i) => (
              <div key={l.level} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-3 py-2 rounded-lg bg-gray-50">
                <span className="text-xs font-mono text-gray-400 w-6">L{l.level}</span>
                <input value={l.name} onChange={e => updateScheduleLevel(i, "name", e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                <input value={l.prefix} onChange={e => updateScheduleLevel(i, "prefix", e.target.value)} className="text-sm w-16 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
                <select value={String(l.parentLevel ?? "")} onChange={e => updateScheduleLevel(i, "parentLevel", e.target.value ? Number(e.target.value) : null)}
                  className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="">None</option>
                  {scheduleLevels.slice(0, i).map(pl => (
                    <option key={pl.level} value={pl.level}>L{pl.level} ({pl.name})</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateScheduleLevel(i, "canAssignResources", !l.canAssignResources)} className={`text-xs px-2 py-1 rounded font-medium ${l.canAssignResources ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>{l.canAssignResources ? "Yes" : "No"}</button>
                  <button onClick={() => removeScheduleLevel(i)} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addScheduleLevel} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"><Plus className="w-3.5 h-3.5" /> Add Level</button>
        </div>

        {/* ─── Weather ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Weather Types</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Configure weather options available in daily reports</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {weatherConfig.map((w, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${w.enabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-400 line-through"}`}>
                {w.label}
                <button onClick={() => toggleWeather(i)} className="hover:opacity-70">{w.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button>
                <button onClick={() => removeWeather(i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={newWeather} onChange={e => setNewWeather(e.target.value)} placeholder="New weather type..." className="flex-1 max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={e => e.key === "Enter" && addWeather()} />
            <button onClick={addWeather} disabled={!newWeather.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
        </div>

        {/* ─── Human Resource Classification ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Human Resource Classification</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Human resource types available in the system and where each type is managed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">Employees</h4>
              </div>
              <p className="text-xs text-blue-700 mb-1">Managed within the HR Module.</p>
              <p className="text-xs text-gray-500 mb-3">Not configurable from the Project Module. Employee data is sourced from the HR module.</p>
              <a href="/apps/hr" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900">
                Manage Employees in HR Module <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-900">Individual Contractors</h4>
              </div>
              <p className="text-xs text-purple-700 mb-1">Managed within the Project Module.</p>
              <p className="text-xs text-gray-500 mb-3">Individual contractors are created and managed in the Resources Overview page and can be assigned to specific projects.</p>
              <a href="/apps/construction/resources" className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:text-purple-900">
                Manage Individual Contractors in Resources <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-orange-600" />
                <h4 className="text-sm font-semibold text-orange-900">Vendors</h4>
              </div>
              <p className="text-xs text-orange-700 mb-1">Managed within the Project Module.</p>
              <p className="text-xs text-gray-500 mb-3">Vendors and subcontractors are created and managed in the Resources Overview page and assigned to projects.</p>
              <a href="/apps/construction/resources" className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900">
                Manage Vendors in Resources <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* ─── Trade Types ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Trade Types</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Construction trade categories used for resource classification and planning</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {tradeTypes.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {t}
                <button onClick={() => removeTrade(t)} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={newTrade} onChange={e => setNewTrade(e.target.value)} placeholder="New trade type..." className="flex-1 max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={e => e.key === "Enter" && addTrade()} />
            <button onClick={addTrade} disabled={!newTrade.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
        </div>

        {/* ─── Report Settings ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Default Report Settings</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Configure default options for generated reports</p>
          <div className="space-y-2">
            {reportSettings.map(rs => (
              <div key={rs.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{rs.label}</span>
                <button onClick={() => toggleReportSetting(rs.id)} className={`flex items-center gap-2 text-sm transition-colors ${rs.enabled ? "text-orange-600" : "text-gray-400"}`}>
                  {rs.enabled ? <><ToggleRight className="w-5 h-5" /> <span className="text-xs font-medium">ON</span></> : <><ToggleLeft className="w-5 h-5" /> <span className="text-xs font-medium">OFF</span></>}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${saved ? "bg-green-600 text-white" : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"}`}>
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Settings Saved" : isSaving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}