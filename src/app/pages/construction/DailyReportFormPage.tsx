import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Save, Send, ArrowLeft, Plus, Trash2, Sun, Cloud, CloudDrizzle, CloudRain, AlertTriangle } from "lucide-react";
import { getProjectById, getTasksByProject, getVendorsByProject, getReportsByProject, fmtDate, staffList } from "./mockData";
import type { DailyReport, DailyManpower, DailyEquipment, DailyMaterial, DailyScope, Weather } from "./types";

const equipmentCategories = [
  "Earthwork", "Lifting", "Concreting", "Transportation",
  "Drilling & Piling", "Formwork & Scaffolding", "Power Generation", "Light Tools",
];

const equipmentByCategory: Record<string, string[]> = {
  Earthwork: ["Excavator", "Bulldozer", "Grader", "Roller", "Dump Truck", "Backhoe"],
  Lifting: ["Tower Crane", "Mobile Crane", "Cherry Picker", "Forklift", "Hoist"],
  Concreting: ["Concrete Mixer", "Concrete Pump", "Concrete Vibrator", "Batching Plant"],
  Transportation: ["Flatbed Truck", "Lowbed Trailer", "Water Tanker", "Fuel Bowser"],
  "Drilling & Piling": ["Rotary Drill", "Pile Driver", "Auger Rig"],
  "Formwork & Scaffolding": ["Formwork Panels", "Scaffolding", "Shore Props"],
  "Power Generation": ["Generator", "Transformer", "Air Compressor"],
  "Light Tools": ["Welding Machine", "Cutting Machine", "Grinder", "Compactor"],
};

const materialCategories = [
  "Aggregates", "Concrete", "Formwork", "Reinforcement",
  "Structural Steel", "Finishing", "Plumbing", "Electrical", "Other",
];

const materialsByCategory: Record<string, string[]> = {
  Aggregates: ["Sharp sand", "Granite chippings", "Gravel", "Stone dust", "Laterite"],
  Concrete: ["Grade 20", "Grade 25", "Grade 30", "Grade 40", "Grout"],
  Formwork: ["Plywood 18mm", "Timber 2x4", "Timber 4x4", "Nails"],
  Reinforcement: ["Rebars Y10", "Rebars Y12", "Rebars Y16", "Rebars Y20", "Mesh"],
  "Structural Steel": ["I-Beam", "H-Beam", "Channel", "Angle bar", "Plate"],
  Finishing: ["Cement bags", "Tiles", "Paint", "Adhesive", "Putty"],
  Plumbing: ["PVC pipes", "GI pipes", "Fittings", "Valves", "Tanks"],
  Electrical: ["Cables", "Conduits", "Switches", "DB Boxes", "Lighting"],
  Other: ["Water", "Diesel", "Bitumen", "Misc"],
};

const units = ["kg", "tonnes", "m\u00B2", "m\u00B3", "bags", "lengths", "pieces", "litres"];
const ownershipOptions = ["Company-owned", "Hired", "Client-supplied"];
const maintStatusOptions = ["Usable", "Under Repair", "Unusable"];

const weatherOptions: { value: Weather; label: string; icon: React.ReactNode }[] = [
  { value: "Sunny", label: "Sunny", icon: <Sun className="w-4 h-4 text-amber-500" /> },
  { value: "Cloudy", label: "Cloudy", icon: <Cloud className="w-4 h-4 text-gray-400" /> },
  { value: "Drizzle", label: "Drizzle", icon: <CloudDrizzle className="w-4 h-4 text-blue-400" /> },
  { value: "Rainy", label: "Rainy", icon: <CloudRain className="w-4 h-4 text-blue-600" /> },
];

let rowCounter = 0;
function nextId(prefix: string) {
  rowCounter += 1;
  return `${prefix}-${Date.now()}-${rowCounter}`;
}

const todayStr = new Date().toISOString().slice(0, 10);

function newManpowerRow(vendors: { id: string; name: string; trade: string }[]): DailyManpower {
  const first = vendors[0];
  return {
    id: nextId("DM"), vendorId: first?.id || "", vendorName: first?.name || "", trade: first?.trade || "",
    block: "", summaryTaskId: "", workPackageId: "", skilledCount: 0, unskilledCount: 0,
    mandays: 0, outputDescription: "", outputUnit: "", comments: "",
  };
}

function newEquipmentRow(): DailyEquipment {
  return {
    id: nextId("DE"), category: "", equipmentType: "", ownership: "Company-owned",
    makeModel: "", tagNumber: "", inUse: true, maintenanceStatus: "Usable",
    maintenanceRequired: false, activity: "", comments: "",
  };
}

function newMaterialRow(opening = 0): DailyMaterial {
  return {
    id: nextId("DMT"), category: "", materialType: "", unit: "tonnes",
    openingStock: opening, receivedQty: 0, issuedQty: 0, closingStock: opening,
    reorderLevel: 0, requestedBy: "", taskId: "", varianceReason: "",
  };
}

function newScopeRow(): DailyScope {
  return {
    id: nextId("DS"), taskId: "", yesterdayPlanned: "", yesterdayActual: "",
    todayPlanned: "", todayActual: "", pctPlanned: 0, pctActual: 0, varianceExplanation: "",
  };
}

export function DailyReportFormPage() {
  const { id: projectId, reportId } = useParams<{ id: string; reportId?: string }>();
  const navigate = useNavigate();
  const project = getProjectById(projectId || "");
  const projectVendors = getVendorsByProject(projectId || "");
  const projectTasks = getTasksByProject(projectId || "");
  const existingReports = getReportsByProject(projectId || "");

  const summaryTasks = projectTasks.filter(t => t.level === 2);
  const workPackages = projectTasks.filter(t => t.level === 4);
  const existingDraft = reportId ? existingReports.find(r => r.id === reportId) : null;

  const prevReport = [...existingReports]
    .filter(r => r.id !== reportId)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))[0];

  const prevDayClosing: Record<string, number> = {};
  if (prevReport) {
    for (const m of prevReport.materials) {
      prevDayClosing[m.materialType] = m.closingStock;
    }
  }

  const [step, setStep] = useState(0);
  const [reportDate, setReportDate] = useState(existingDraft?.reportDate || todayStr);
  const [weather, setWeather] = useState<Weather>(existingDraft?.weather || "Sunny");

  const [manpowerRows, setManpowerRows] = useState<DailyManpower[]>(
    existingDraft?.manpower.length ? existingDraft.manpower : [newManpowerRow(projectVendors)]
  );
  const [equipmentRows, setEquipmentRows] = useState<DailyEquipment[]>(
    existingDraft?.equipment.length ? existingDraft.equipment : [newEquipmentRow()]
  );
  const [materialRows, setMaterialRows] = useState<DailyMaterial[]>(
    existingDraft?.materials.length ? existingDraft.materials : [newMaterialRow(0)]
  );
  const [scopeRows, setScopeRows] = useState<DailyScope[]>(
    existingDraft?.scope.length ? existingDraft.scope : [newScopeRow()]
  );

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function showToast(msg: string) { setToast(msg); }

  const getVendorName = (id: string) => projectVendors.find(v => v.id === id)?.name || "";
  const getVendorTrade = (id: string) => projectVendors.find(v => v.id === id)?.trade || "";

  function updateManpowerRow(i: number, patch: Partial<DailyManpower>) {
    setManpowerRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      if ("skilledCount" in patch || "unskilledCount" in patch) {
        next[i].mandays = (next[i].skilledCount || 0) + (next[i].unskilledCount || 0);
      }
      if ("vendorId" in patch) {
        next[i].vendorName = getVendorName(patch.vendorId || "");
        next[i].trade = getVendorTrade(patch.vendorId || "");
      }
      return next;
    });
  }

  function updateEquipmentRow(i: number, patch: Partial<DailyEquipment>) {
    setEquipmentRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      if ("category" in patch) {
        next[i].equipmentType = "";
      }
      return next;
    });
  }

  function updateMaterialRow(i: number, patch: Partial<DailyMaterial>) {
    setMaterialRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      if ("category" in patch) {
        next[i].materialType = "";
      }
      if (("receivedQty" in patch) || ("issuedQty" in patch) || ("openingStock" in patch)) {
        next[i].closingStock = (next[i].openingStock || 0) + (next[i].receivedQty || 0) - (next[i].issuedQty || 0);
      }
      if ("materialType" in patch && prevDayClosing[patch.materialType || ""] !== undefined) {
        next[i].openingStock = prevDayClosing[patch.materialType || ""];
        next[i].closingStock = prevDayClosing[patch.materialType || ""] + (next[i].receivedQty || 0) - (next[i].issuedQty || 0);
      }
      return next;
    });
  }

  function updateScopeRow(i: number, patch: Partial<DailyScope>) {
    setScopeRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function addManpowerRow() {
    setManpowerRows(prev => [...prev, newManpowerRow(projectVendors)]);
  }

  function addEquipmentRow() {
    setEquipmentRows(prev => [...prev, newEquipmentRow()]);
  }

  function addMaterialRow() {
    setMaterialRows(prev => [...prev, newMaterialRow(0)]);
  }

  function addScopeRow() {
    setScopeRows(prev => [...prev, newScopeRow()]);
  }

  function removeManpowerRow(i: number) {
    setManpowerRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function removeEquipmentRow(i: number) {
    setEquipmentRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function removeMaterialRow(i: number) {
    setMaterialRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function removeScopeRow(i: number) {
    setScopeRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSave(status: "draft" | "submitted") {
    setSaving(true);
    const report: DailyReport = {
      id: existingDraft?.id || nextId("DR"),
      projectId: projectId || "",
      reportDate,
      weather,
      submittedBy: existingDraft?.submittedBy || staffList[0],
      submittedAt: existingDraft?.submittedAt || new Date().toISOString(),
      status,
      unlockedBy: null,
      unlockReason: null,
      manpower: manpowerRows,
      equipment: equipmentRows,
      materials: materialRows,
      scope: scopeRows,
    };
    setTimeout(() => {
      setSaving(false);
      showToast(
        status === "draft"
          ? "Report saved as draft"
          : "Report submitted successfully"
      );
      setTimeout(() => navigate(".."), 1200);
    }, 600);
  }

  const steps = [
    { label: "Manpower", count: manpowerRows.length },
    { label: "Equipment", count: equipmentRows.length },
    { label: "Materials", count: materialRows.length },
    { label: "Scope & Delivery", count: scopeRows.length },
  ];

  const progressPct = ((step + 1) / steps.length) * 100;

  return (
    <div className="space-y-6" style={{ backgroundColor: "#F7F8FA" }}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("..")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {existingDraft ? "Edit Daily Report" : "New Daily Report"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{project?.name || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium" style={{ color: "#E8973A" }}>{fmtDate(reportDate)}</span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  i === step
                    ? "text-white"
                    : i < step
                    ? "text-white"
                    : "text-gray-400 bg-gray-100"
                }`}
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: i === step ? "#E8973A" : i < step ? "#22C55E" : undefined,
                }}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === step ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              <span className="text-[10px] text-gray-400 -mt-0.5">{s.count} item{s.count !== 1 ? "s" : ""}</span>
            </button>
          ))}
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: "#E8973A" }}
          />
        </div>
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        {/* Date & Weather always visible */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm outline-none focus:border-[#E8973A]"
                style={{ minHeight: 44 }}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Weather</label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value as Weather)}
                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm outline-none focus:border-[#E8973A]"
                style={{ minHeight: 44, minWidth: 140 }}
              >
                {weatherOptions.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
              <div className="flex items-center">
                {weatherOptions.find(w => w.value === weather)?.icon}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION A: Manpower */}
        {step === 0 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Section A: Manpower</h2>
              <button
                onClick={addManpowerRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E8973A", minHeight: 44 }}
              >
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            </div>
            <div className="space-y-4">
              {manpowerRows.map((row, i) => (
                <div key={row.id} className="border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Vendor #{i + 1}</span>
                    {manpowerRows.length > 1 && (
                      <button onClick={() => removeManpowerRow(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Vendor</label>
                      <select
                        value={row.vendorId}
                        onChange={e => updateManpowerRow(i, { vendorId: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select vendor...</option>
                        {projectVendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Trade</label>
                      <input
                        type="text"
                        value={row.trade}
                        readOnly
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm bg-gray-50 text-gray-500 outline-none"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Block / Unit</label>
                      <input
                        type="text"
                        value={row.block}
                        onChange={e => updateManpowerRow(i, { block: e.target.value })}
                        placeholder="e.g. Tower A, Block 3"
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Summary Task</label>
                      <select
                        value={row.summaryTaskId}
                        onChange={e => {
                          const val = e.target.value;
                          updateManpowerRow(i, { summaryTaskId: val, workPackageId: "" });
                        }}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select summary task...</option>
                        {summaryTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Work Package</label>
                      <select
                        value={row.workPackageId}
                        onChange={e => updateManpowerRow(i, { workPackageId: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select WP...</option>
                        {workPackages
                          .filter(wp => !row.summaryTaskId || wp.parentTaskId === row.summaryTaskId)
                          .map(wp => (
                            <option key={wp.id} value={wp.id}>{wp.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Skilled Workers</label>
                      <input
                        type="number"
                        min={0}
                        value={row.skilledCount || ""}
                        onChange={e => updateManpowerRow(i, { skilledCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Unskilled Workers</label>
                      <input
                        type="number"
                        min={0}
                        value={row.unskilledCount || ""}
                        onChange={e => updateManpowerRow(i, { unskilledCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Man-days (auto)</label>
                      <input
                        type="number"
                        value={row.mandays}
                        readOnly
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm bg-gray-50 text-gray-500 outline-none"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Output Description</label>
                      <input
                        type="text"
                        value={row.outputDescription}
                        onChange={e => updateManpowerRow(i, { outputDescription: e.target.value })}
                        placeholder="e.g. 150 blocks laid"
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">Comments</label>
                      <input
                        type="text"
                        value={row.comments}
                        onChange={e => updateManpowerRow(i, { comments: e.target.value })}
                        placeholder="Any remarks..."
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION B: Equipment */}
        {step === 1 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Section B: Equipment</h2>
              <button
                onClick={addEquipmentRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E8973A", minHeight: 44 }}
              >
                <Plus className="w-4 h-4" /> Add Equipment
              </button>
            </div>
            <div className="space-y-4">
              {equipmentRows.map((row, i) => (
                <div key={row.id} className="border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Equipment #{i + 1}</span>
                    {equipmentRows.length > 1 && (
                      <button onClick={() => removeEquipmentRow(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Category</label>
                      <select
                        value={row.category}
                        onChange={e => updateEquipmentRow(i, { category: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select category...</option>
                        {equipmentCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Type</label>
                      <select
                        value={row.equipmentType}
                        onChange={e => updateEquipmentRow(i, { equipmentType: e.target.value })}
                        disabled={!row.category}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A] disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select type...</option>
                        {(equipmentByCategory[row.category] || []).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Ownership</label>
                      <select
                        value={row.ownership}
                        onChange={e => updateEquipmentRow(i, { ownership: e.target.value as DailyEquipment["ownership"] })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        {ownershipOptions.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Make / Model</label>
                      <input
                        type="text"
                        value={row.makeModel}
                        onChange={e => updateEquipmentRow(i, { makeModel: e.target.value })}
                        placeholder="e.g. CAT 320D"
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Tag / ID</label>
                      <input
                        type="text"
                        value={row.tagNumber}
                        onChange={e => updateEquipmentRow(i, { tagNumber: e.target.value })}
                        placeholder="e.g. EX-001"
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">In Use</label>
                      <select
                        value={row.inUse ? "yes" : "no"}
                        onChange={e => updateEquipmentRow(i, { inUse: e.target.value === "yes" })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Maintenance Status</label>
                      <select
                        value={row.maintenanceStatus}
                        onChange={e => updateEquipmentRow(i, { maintenanceStatus: e.target.value as DailyEquipment["maintenanceStatus"] })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        {maintStatusOptions.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Maintenance Required</label>
                      <select
                        value={row.maintenanceRequired ? "yes" : "no"}
                        onChange={e => updateEquipmentRow(i, { maintenanceRequired: e.target.value === "yes" })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">Activity Worked On</label>
                      <input
                        type="text"
                        value={row.activity}
                        onChange={e => updateEquipmentRow(i, { activity: e.target.value })}
                        placeholder="e.g. Foundation excavation"
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">Comments</label>
                      <input
                        type="text"
                        value={row.comments}
                        onChange={e => updateEquipmentRow(i, { comments: e.target.value })}
                        placeholder="Any remarks..."
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: Materials */}
        {step === 2 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Section C: Materials</h2>
              <button
                onClick={addMaterialRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E8973A", minHeight: 44 }}
              >
                <Plus className="w-4 h-4" /> Add Material
              </button>
            </div>
            {prevReport && (
              <div className="mb-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Opening stock pre-populated from {fmtDate(prevReport.reportDate)} closing stock
              </div>
            )}
            <div className="space-y-4">
              {materialRows.map((row, i) => (
                <div key={row.id} className="border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Material #{i + 1}</span>
                    {materialRows.length > 1 && (
                      <button onClick={() => removeMaterialRow(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Category</label>
                      <select
                        value={row.category}
                        onChange={e => updateMaterialRow(i, { category: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select category...</option>
                        {materialCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Material Type</label>
                      <select
                        value={row.materialType}
                        onChange={e => updateMaterialRow(i, { materialType: e.target.value })}
                        disabled={!row.category}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A] disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select type...</option>
                        {(materialsByCategory[row.category] || []).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Unit</label>
                      <select
                        value={row.unit}
                        onChange={e => updateMaterialRow(i, { unit: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Opening Stock</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.openingStock || ""}
                        onChange={e => updateMaterialRow(i, { openingStock: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Qty Received</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.receivedQty || ""}
                        onChange={e => updateMaterialRow(i, { receivedQty: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Qty Issued</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.issuedQty || ""}
                        onChange={e => updateMaterialRow(i, { issuedQty: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Closing Stock (auto)</label>
                      <input
                        type="number"
                        value={row.closingStock}
                        readOnly
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm bg-gray-50 text-gray-500 outline-none"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Reorder Level</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={row.reorderLevel || ""}
                        onChange={e => updateMaterialRow(i, { reorderLevel: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Requested By</label>
                      <select
                        value={row.requestedBy}
                        onChange={e => updateMaterialRow(i, { requestedBy: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select...</option>
                        {staffList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Work Package</label>
                      <select
                        value={row.taskId}
                        onChange={e => updateMaterialRow(i, { taskId: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      >
                        <option value="">Select WP...</option>
                        {workPackages.map(wp => (
                          <option key={wp.id} value={wp.id}>{wp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-gray-500">Variance Reason</label>
                      <input
                        type="text"
                        value={row.varianceReason}
                        onChange={e => updateMaterialRow(i, { varianceReason: e.target.value })}
                        placeholder="Explain any discrepancy..."
                        className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                        style={{ minHeight: 44 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION D: Scope */}
        {step === 3 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Section D: Scope & Delivery</h2>
              <button
                onClick={addScopeRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E8973A", minHeight: 44 }}
              >
                <Plus className="w-4 h-4" /> Add Work Package
              </button>
            </div>
            <div className="space-y-4">
              {scopeRows.map((row, i) => {
                const needsVariance = row.pctActual < row.pctPlanned - 10;
                return (
                  <div key={row.id} className="border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Scope #{i + 1}</span>
                      {scopeRows.length > 1 && (
                        <button onClick={() => removeScopeRow(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs text-gray-500">Work Package</label>
                        <select
                          value={row.taskId}
                          onChange={e => updateScopeRow(i, { taskId: e.target.value })}
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        >
                          <option value="">Select WP...</option>
                          {workPackages.map(wp => (
                            <option key={wp.id} value={wp.id}>{wp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Work Scheduled Yesterday</label>
                        <input
                          type="text"
                          value={row.yesterdayPlanned}
                          onChange={e => updateScopeRow(i, { yesterdayPlanned: e.target.value })}
                          placeholder="What was planned?"
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Work Done Yesterday</label>
                        <input
                          type="text"
                          value={row.yesterdayActual}
                          onChange={e => updateScopeRow(i, { yesterdayActual: e.target.value })}
                          placeholder="What was actually done?"
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Work Scheduled Today</label>
                        <input
                          type="text"
                          value={row.todayPlanned}
                          onChange={e => updateScopeRow(i, { todayPlanned: e.target.value })}
                          placeholder="What is planned for today?"
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Work Done Today</label>
                        <input
                          type="text"
                          value={row.todayActual}
                          onChange={e => updateScopeRow(i, { todayActual: e.target.value })}
                          placeholder="What is actually done today?"
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">% Planned Complete</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={row.pctPlanned || ""}
                          onChange={e => updateScopeRow(i, { pctPlanned: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="w-full border border-[#E2E8F0] rounded-md px-3 text-sm outline-none focus:border-[#E8973A]"
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">% Actual Complete</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={row.pctActual || ""}
                          onChange={e => updateScopeRow(i, { pctActual: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className={`w-full border rounded-md px-3 text-sm outline-none focus:border-[#E8973A] ${
                            needsVariance ? "border-red-300 bg-red-50" : "border-[#E2E8F0]"
                          }`}
                          style={{ minHeight: 44 }}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs text-gray-500 flex items-center gap-1.5">
                          Variance Explanation
                          {needsVariance && (
                            <span className="text-red-500 flex items-center gap-1 text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Required (actual &lt; planned by &gt;10%)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={row.varianceExplanation}
                          onChange={e => updateScopeRow(i, { varianceExplanation: e.target.value })}
                          placeholder={needsVariance ? "Explain why actual is behind planned..." : "Any variance notes..."}
                          className={`w-full border rounded-md px-3 text-sm outline-none focus:border-[#E8973A] ${
                            needsVariance && !row.varianceExplanation ? "border-red-300" : "border-[#E2E8F0]"
                          }`}
                          style={{ minHeight: 44 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-[#E2E8F0] hover:bg-gray-50 transition-colors"
              style={{ minHeight: 44 }}
            >
              Previous: {steps[step - 1].label}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#E8973A", minHeight: 44 }}
            >
              Next: {steps[step + 1].label}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium border-2 transition-colors disabled:opacity-50"
                style={{ borderColor: "#E8973A", color: "#E8973A", minHeight: 44 }}
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSave("submitted")}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#E8973A", minHeight: 44 }}
              >
                <Send className="w-4 h-4" /> {saving ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
