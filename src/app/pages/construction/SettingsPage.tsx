import { useState } from "react";
import { Settings, Save, Plus, Trash2, ToggleLeft, ToggleRight, X, Check } from "lucide-react";

const defaultClusters = ["Lekki-VI", "Ikeja", "Apapa", "Victoria Island", "Ikoyi"];
const defaultTradeTypes = [
  "Masonry", "Concreting labor", "Carpentry (formwork)", "Carpentry (roofing)",
  "Iron benders / steel fixers", "Tiling", "Plumbing", "Electrical",
  "Painting", "Glazing / aluminum works", "General operations / laboring",
  "Equipment operation", "Scaffolding", "Welding",
];

interface ReportSetting {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
}

const defaultReportSettings: ReportSetting[] = [
  { id: "rs1", key: "auto_generate_weekly", label: "Auto-generate weekly progress report", enabled: true },
  { id: "rs2", key: "rag_summary", label: "Include RAG summary in reports", enabled: true },
  { id: "rs3", key: "cost_breakdown", label: "Include cost breakdown", enabled: true },
  { id: "rs4", key: "vendor_performance", label: "Include vendor performance metrics", enabled: false },
  { id: "rs5", key: "schedule_gantt", label: "Include schedule Gantt chart", enabled: true },
  { id: "rs6", key: "daily_report_reminder", label: "Daily report submission reminder", enabled: true },
];

export function SettingsPage() {
  const [clusters, setClusters] = useState<string[]>(defaultClusters);
  const [tradeTypes, setTradeTypes] = useState<string[]>(defaultTradeTypes);
  const [reportSettings, setReportSettings] = useState<ReportSetting[]>(defaultReportSettings);
  const [newCluster, setNewCluster] = useState("");
  const [newTrade, setNewTrade] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  function addCluster() {
    if (!newCluster.trim() || clusters.includes(newCluster.trim())) return;
    setClusters(prev => [...prev, newCluster.trim()]);
    setNewCluster("");
  }

  function removeCluster(c: string) {
    setClusters(prev => prev.filter(x => x !== c));
  }

  function addTrade() {
    if (!newTrade.trim() || tradeTypes.includes(newTrade.trim())) return;
    setTradeTypes(prev => [...prev, newTrade.trim()]);
    setNewTrade("");
  }

  function removeTrade(t: string) {
    setTradeTypes(prev => prev.filter(x => x !== t));
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
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            saved ? "bg-green-600 text-white" : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Clusters Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Clusters Management</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Geographic clusters used to group construction projects</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {clusters.map(c => (
              <span key={c} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {c}
                <button onClick={() => removeCluster(c)} className="hover:text-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={newCluster}
              onChange={e => setNewCluster(e.target.value)}
              placeholder="New cluster name..."
              className="flex-1 max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={e => e.key === "Enter" && addCluster()}
            />
            <button
              onClick={addCluster}
              disabled={!newCluster.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Trade Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Trade Types</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Construction trade categories used for vendor classification and resource planning</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {tradeTypes.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {t}
                <button onClick={() => removeTrade(t)} className="hover:text-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={newTrade}
              onChange={e => setNewTrade(e.target.value)}
              placeholder="New trade type..."
              className="flex-1 max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={e => e.key === "Enter" && addTrade()}
            />
            <button
              onClick={addTrade}
              disabled={!newTrade.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Default Report Settings */}
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
                <button
                  onClick={() => toggleReportSetting(rs.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    rs.enabled ? "text-orange-600" : "text-gray-400"
                  }`}
                >
                  {rs.enabled ? (
                    <><ToggleRight className="w-5 h-5" /> <span className="text-xs font-medium">ON</span></>
                  ) : (
                    <><ToggleLeft className="w-5 h-5" /> <span className="text-xs font-medium">OFF</span></>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save bar at bottom */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              saved ? "bg-green-600 text-white" : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Settings Saved" : isSaving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
