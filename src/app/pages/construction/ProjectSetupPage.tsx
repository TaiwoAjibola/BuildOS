import { useParams } from "react-router";
import { useState, useMemo } from "react";
import {
  CheckCircle, Circle, ArrowRight, ArrowLeft, Lock, Calendar,
  Building2, Users, Layers, FileText, Plus, X, Trash2, ChevronRight, ChevronDown, Tags
} from "lucide-react";
import { getProjectById, staffList, tradeTypes, clusters, tasks as allTasks, fmtDate, vendors as allVendors, defaultScheduleLevels } from "./mockData";
import type { Task, Vendor, ProjectCalendar, Sector, ProjectStructureItem, ScheduleLevelConfig } from "./types";
import { SECTOR_CATEGORIES, getBlockLabel, getStructureConfig, DEFAULT_WBS_LEVELS } from "./types";

const STEPS = [
  { id: "basic", label: "Basic Information", icon: FileText },
  { id: "project-type", label: "Project Type", icon: Tags },
  { id: "resources", label: "Resources", icon: Users },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "schedule", label: "Schedule Builder", icon: Layers },
  { id: "summary", label: "Summary", icon: Lock },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

const SECTORS: Sector[] = [
  "Building & Construction",
  "Civil & Infrastructure",
  "Industrial & Facilities",
  "Interior & Fit-out",
  "Renovation & Maintenance",
  "Other",
];

const LEVEL_NAMES: Record<number, string> = {};
const LEVEL_PREFIX: Record<number, string> = {};
defaultScheduleLevels.forEach(l => { LEVEL_NAMES[l.level] = l.name; LEVEL_PREFIX[l.level] = l.prefix; });

const EMPTY_VENDOR_FORM = {
  name: "", trade: "", contractType: "Labor-only" as Vendor["contractType"],
  isNominated: false, contractSum: 0, blockAssignment: "",
  skilledCount: 0, unskilledCount: 0, mandaysEstimate: 0,
  status: "Awarded" as Vendor["status"],
};

export function ProjectSetupPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const project = getProjectById(projectId!);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 0 — Basic Information
  const [basicInfo, setBasicInfo] = useState({
    name: project?.name || "",
    client: project?.client || "",
    projectManager: project?.projectManager || "",
    plannedStartDate: project?.plannedStartDate || "",
    plannedEndDate: project?.plannedEndDate || "",
    contractType: project?.contractType || "Lump Sum" as "Lump Sum" | "Remeasurable" | "Cost Plus",
    clusterId: project?.clusterId || "",
    location: project?.location || "",
    siteAddress: project?.siteAddress || "",
    description: project?.description || "",
  });

  // Step 1 — Project Type
  const [projectSector, setProjectSector] = useState<Sector | "">(project?.sector || "");
  const [projectCategory, setProjectCategory] = useState(project?.category || "");
  const [projectDescriptor, setProjectDescriptor] = useState(project?.descriptor || "");

  const blockLabel = useMemo(() => getBlockLabel(projectSector as Sector, projectCategory), [projectSector, projectCategory]);
  const structureConfig = useMemo(() => projectCategory ? getStructureConfig(projectCategory) : null, [projectCategory]);

  const [structureEntries, setStructureEntries] = useState<Array<{
    id: string;
    name: string;
    innerUnitCount: number;
    attributes: Record<string, string | number>;
    innerAttributes: Record<string, string | number>;
  }>>([]);

  const addStructureEntry = () => {
    const config = structureConfig;
    if (!config) return;
    const newEntry = {
      id: `SE-${structureEntries.length + 1}`,
      name: "",
      innerUnitCount: 1,
      attributes: {} as Record<string, string | number>,
      innerAttributes: {} as Record<string, string | number>,
    };
    config.subUnitFields.forEach(f => {
      newEntry.attributes[f.key] = f.type === "number" ? 0 : "";
    });
    config.innerFields.forEach(f => {
      newEntry.innerAttributes[f.key] = f.type === "number" ? 0 : (f.options?.[0] ?? "");
    });
    setStructureEntries(prev => [...prev, newEntry]);
  };

  const updateStructureEntry = (id: string, field: string, value: string | number) => {
    setStructureEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const updateStructureEntryAttr = (id: string, key: string, value: string | number) => {
    setStructureEntries(prev => prev.map(e => e.id === id ? { ...e, attributes: { ...e.attributes, [key]: value } } : e));
  };

  const updateStructureEntryInnerAttr = (id: string, key: string, value: string | number) => {
    setStructureEntries(prev => prev.map(e => e.id === id ? { ...e, innerAttributes: { ...e.innerAttributes, [key]: value } } : e));
  };

  const removeStructureEntry = (id: string) => {
    setStructureEntries(prev => prev.filter(e => e.id !== id));
  };

  const totalSubUnits = structureEntries.length;
  const totalInnerUnits = structureEntries.reduce((sum, e) => sum + (e.innerUnitCount || 0), 0);

  // Step 2 — Schedule Builder
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "", level: 4 as 1 | 2 | 3 | 4, parentTaskId: "",
    plannedStart: "", plannedEnd: "",
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Step 3 — Vendor Registration
  const [projectVendors, setProjectVendors] = useState<Vendor[]>([]);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR_FORM);
  const [selectedExistingVendor, setSelectedExistingVendor] = useState("");
  const [vendorStageAssignments, setVendorStageAssignments] = useState<Record<string, string[]>>({});
  const [isNewVendor, setIsNewVendor] = useState(false);

  // Step 4 — Calendar
  const emptyCalendar: ProjectCalendar = {
    id: "", projectId: projectId || "",
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    holidays: [],
    shutdowns: [],
  };
  const [calendarData, setCalendarData] = useState<ProjectCalendar>(emptyCalendar);
  const [newHoliday, setNewHoliday] = useState({ date: "", label: "" });
  const [newShutdown, setNewShutdown] = useState({ start: "", end: "", label: "" });

  // Step 5 — Baseline
  const [baselineLocked, setBaselineLocked] = useState(false);

  const toggleDay = (dayIdx: number) => {
    setCalendarData(prev => {
      const days = prev.workingDays.includes(dayIdx)
        ? prev.workingDays.filter(d => d !== dayIdx)
        : [...prev.workingDays, dayIdx].sort((a, b) => {
            const order = [1, 2, 3, 4, 5, 6, 0];
            return order.indexOf(a) - order.indexOf(b);
          });
      return { ...prev, workingDays: days };
    });
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.label) return;
    setCalendarData(prev => ({
      ...prev,
      holidays: [...prev.holidays, { date: newHoliday.date, label: newHoliday.label }],
    }));
    setNewHoliday({ date: "", label: "" });
  };

  const removeHoliday = (idx: number) => {
    setCalendarData(prev => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== idx),
    }));
  };

  const addShutdown = () => {
    if (!newShutdown.start || !newShutdown.end || !newShutdown.label) return;
    setCalendarData(prev => ({
      ...prev,
      shutdowns: [...prev.shutdowns, { start: newShutdown.start, end: newShutdown.end, label: newShutdown.label }],
    }));
    setNewShutdown({ start: "", end: "", label: "" });
  };

  const removeShutdown = (idx: number) => {
    setCalendarData(prev => ({
      ...prev,
      shutdowns: prev.shutdowns.filter((_, i) => i !== idx),
    }));
  };

  // Task helpers
  const rootTasks = useMemo(() => projectTasks.filter(t => t.level === 1), [projectTasks]);

  const maxTaskId = useMemo(() => {
    const max = allTasks.reduce((m, t) => {
      const num = parseInt(t.id.replace(/^\D+/, ""), 10);
      return num > m ? num : m;
    }, 0);
    return max + projectTasks.length + 1;
  }, [projectTasks.length]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addTask = () => {
    if (!taskForm.name.trim()) return;
    const prefix = LEVEL_PREFIX[taskForm.level];
    const newId = `${prefix}-${String(maxTaskId).padStart(3, "0")}`;
    const s = taskForm.plannedStart || new Date().toISOString().split("T")[0];
    const e = taskForm.plannedEnd || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const dur = Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);
    const task: Task = {
      id: newId, projectId: projectId!, parentTaskId: taskForm.parentTaskId || null,
      level: taskForm.level, name: taskForm.name.trim(),
      plannedStart: s, plannedEnd: e, actualStart: null, actualEnd: null,
      plannedDuration: dur, actualDuration: null, percentComplete: 0,
      predecessorId: null, dependencyType: null, lagDays: 0,
      vendorId: null, ragStatus: "on-track", ragOverride: false, notes: "",
    };
    setProjectTasks(prev => [...prev, task]);
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(task.id);
      if (task.parentTaskId) next.add(task.parentTaskId);
      return next;
    });
    setTaskForm({ name: "", level: 4, parentTaskId: "", plannedStart: "", plannedEnd: "" });
    setShowAddTask(false);
  };

  const removeTask = (id: string) => {
    const idsToRemove = new Set<string>();
    const collect = (taskId: string) => {
      idsToRemove.add(taskId);
      projectTasks.filter(t => t.parentTaskId === taskId).forEach(t => collect(t.id));
    };
    collect(id);
    setProjectTasks(prev => prev.filter(t => !idsToRemove.has(t.id)));
  };

  // Vendor helpers
  const uniqueVendors = useMemo(() => {
    const seen = new Set<string>();
    return allVendors.filter(v => {
      const key = v.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const handleSelectExistingVendor = (id: string) => {
    setSelectedExistingVendor(id);
    if (id === "__new__") {
      setIsNewVendor(true);
      setVendorForm(EMPTY_VENDOR_FORM);
    } else if (id === "") {
      setIsNewVendor(false);
      setVendorForm(EMPTY_VENDOR_FORM);
    } else {
      setIsNewVendor(false);
      const v = allVendors.find(v => v.id === id);
      if (v) {
        setVendorForm({
          name: v.name, trade: v.trade, contractType: v.contractType,
          isNominated: v.isNominated, contractSum: v.contractSum, blockAssignment: v.blockAssignment,
          skilledCount: v.skilledCount, unskilledCount: v.unskilledCount,
          mandaysEstimate: v.mandaysEstimate, status: v.status,
        });
      }
    }
  };

  const toggleStageForVendor = (vendorId: string, stageId: string) => {
    setVendorStageAssignments(prev => {
      const current = prev[vendorId] || [];
      const updated = current.includes(stageId)
        ? current.filter(s => s !== stageId)
        : [...current, stageId];
      return { ...prev, [vendorId]: updated };
    });
  };

  const addVendor = () => {
    if (!vendorForm.name || !vendorForm.trade) return;
    const newV: Vendor = {
      id: `V-${String(projectVendors.length + 1).padStart(3, "0")}`,
      projectId: projectId!, assignedWorkPackages: [], ...vendorForm,
    };
    if (!vendorStageAssignments[newV.id]) {
      setVendorStageAssignments(prev => ({ ...prev, [newV.id]: [] }));
    }
    setProjectVendors(prev => [...prev, newV]);
    setVendorForm(EMPTY_VENDOR_FORM);
    setSelectedExistingVendor("");
    setIsNewVendor(false);
  };

  const removeVendor = (id: string) => {
    setProjectVendors(prev => prev.filter(v => v.id !== id));
    setVendorStageAssignments(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Navigation
  const goNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (step: number) => {
    if (step < currentStep || completedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  const handleCompleteSetup = () => {
    setCompletedSteps(prev => new Set([...prev, 5]));
    setBaselineLocked(true);
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  if (!project && basicInfo.name) {
    // Allow creating a new project — show setup even without existing project
  }

  // Progress indicator rendering
  const renderProgress = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const isCompleted = completedSteps.has(idx);
        const isCurrent = currentStep === idx;
        const isClickable = idx < currentStep || completedSteps.has(idx);

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && goToStep(idx)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 transition-opacity ${isClickable ? "cursor-pointer" : "cursor-default"} ${!isClickable ? "opacity-50" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
                style={isCurrent && !isCompleted ? { backgroundColor: "#E8973A" } : {}}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                      ? "font-semibold"
                      : "text-gray-400"
                }`}
                style={isCurrent && !isCompleted ? { color: "#E8973A" } : {}}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 rounded-full ${
                  completedSteps.has(idx) ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 1 — Project Type Classification
  const renderProjectType = () => {
    const categories = projectSector ? SECTOR_CATEGORIES[projectSector as Sector] : [];
    return (
      <div className="rounded-xl border p-6 space-y-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#1A202C" }}>Project Type Classification</h2>
          <p className="text-sm mt-1" style={{ color: "#718096" }}>
            Classify your project so the system can suggest the right schedule template, quality tests, HSE requirements, and vendor trades.
          </p>
        </div>

        {/* Level 1 — Sector */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "#1A202C" }}>Level 1 — Sector</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SECTORS.map(s => {
              const selected = projectSector === s;
              return (
                <button
                  key={s}
                  onClick={() => { setProjectSector(s); setProjectCategory(""); }}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selected ? "text-white border-transparent" : "hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor: selected ? "#E8973A" : "white",
                    borderColor: selected ? "#E8973A" : "#E2E8F0",
                    color: selected ? "white" : "#1A202C",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level 2 — Category */}
        {projectSector && categories.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: "#1A202C" }}>Level 2 — Project Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map(c => {
                const selected = projectCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => setProjectCategory(c)}
                    className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                      selected ? "text-white border-transparent" : "hover:bg-gray-50"
                    }`}
                    style={{
                      backgroundColor: selected ? "#E8973A" : "white",
                      borderColor: selected ? "#E8973A" : "#E2E8F0",
                      color: selected ? "white" : "#1A202C",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Level 3 — Descriptor */}
        {projectCategory && (
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "#1A202C" }}>
              Level 3 — Specific Descriptor <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text" value={projectDescriptor}
              onChange={e => setProjectDescriptor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
              placeholder="e.g. 22-storey commercial tower, 120-unit estate"
            />
          </div>
        )}

        {projectSector && projectCategory && (
          <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "#FEF6E6", border: "1px solid #F4A623" }}>
            <p className="font-semibold" style={{ color: "#B0780F" }}>Selected Classification</p>
            <p style={{ color: "#B0780F" }}>
              {projectSector} &rarr; {projectCategory}
              {projectDescriptor ? ` — ${projectDescriptor}` : ""}
            </p>
          </div>
        )}

        {/* Level 4 — Structure Breakdown */}
        {structureConfig && (
          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#1A202C" }}>
                Level 4 — Physical Structure Breakdown
              </h3>
              <p className="text-sm mt-1" style={{ color: "#718096" }}>
                Define the {structureConfig.subUnitLabel}s and {structureConfig.innerUnitLabel}s that make up this project.
              </p>
            </div>

            {structureEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {structureConfig.subUnitLabel.toLowerCase()}s defined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {structureEntries.map((entry, idx) => (
                  <div key={entry.id} className="border rounded-lg p-4" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{ color: "#1A202C" }}>
                        {structureConfig.subUnitLabel} {idx + 1}
                      </span>
                      <button onClick={() => removeStructureEntry(entry.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{structureConfig.subUnitItemLabel}</label>
                        <input
                          type="text" value={entry.name}
                          onChange={e => updateStructureEntry(entry.id, "name", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                          placeholder={`e.g. ${structureConfig.subUnitLabel} A`}
                        />
                      </div>
                      {structureConfig.subUnitFields.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                          {f.type === "number" ? (
                            <input
                              type="number" value={entry.attributes[f.key] ?? ""}
                              onChange={e => updateStructureEntryAttr(entry.id, f.key, e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                            />
                          ) : (
                            <input
                              type="text" value={entry.attributes[f.key] ?? ""}
                              onChange={e => updateStructureEntryAttr(entry.id, f.key, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                            />
                          )}
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Number of {structureConfig.innerUnitLabel}s</label>
                        <input
                          type="number" min={1} value={entry.innerUnitCount}
                          onChange={e => updateStructureEntry(entry.id, "innerUnitCount", Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                        />
                      </div>
                      {structureConfig.innerFields.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{f.label} (per {structureConfig.innerUnitLabel})</label>
                          {f.type === "select" && f.options ? (
                            <select
                              value={entry.innerAttributes[f.key] ?? ""}
                              onChange={e => updateStructureEntryInnerAttr(entry.id, f.key, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                            >
                              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type={f.type === "number" ? "number" : "text"}
                              value={entry.innerAttributes[f.key] ?? ""}
                              onChange={e => updateStructureEntryInnerAttr(entry.id, f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm"
                              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={addStructureEntry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium w-fit"
              style={{ color: "#E8973A", border: "1px dashed #E8973A", backgroundColor: "#FFF8F0" }}
            >
              <Plus className="w-4 h-4" /> Add {structureConfig.subUnitLabel}
            </button>

            {structureEntries.length > 0 && (
              <div className="rounded-lg p-3 border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
                <p className="font-medium text-gray-900">
                  {totalSubUnits} {structureConfig.subUnitLabel}(s) &middot; {totalInnerUnits} Total {structureConfig.innerUnitLabel}s
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Step 0 — Basic Information
  const renderBasicInfo = () => (
    <div className="rounded-xl border p-6 space-y-5" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
      <h2 className="text-lg font-bold" style={{ color: "#1A202C" }}>Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text" value={basicInfo.name}
            onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            placeholder="e.g. Lekki Tower A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <input
            type="text" value={basicInfo.client}
            onChange={e => setBasicInfo({ ...basicInfo, client: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            placeholder="e.g. Lekki Gardens Ltd"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
          <select
            value={basicInfo.projectManager}
            onChange={e => setBasicInfo({ ...basicInfo, projectManager: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="">Select PM</option>
            {staffList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
          <select
            value={basicInfo.contractType}
            onChange={e => setBasicInfo({ ...basicInfo, contractType: e.target.value as "Lump Sum" | "Remeasurable" | "Cost Plus" })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="Lump Sum">Lump Sum</option>
            <option value="Remeasurable">Remeasurable</option>
            <option value="Cost Plus">Cost Plus</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
          <input
            type="date" value={basicInfo.plannedStartDate}
            onChange={e => setBasicInfo({ ...basicInfo, plannedStartDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
          <input
            type="date" value={basicInfo.plannedEndDate}
            onChange={e => setBasicInfo({ ...basicInfo, plannedEndDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cluster</label>
          <select
            value={basicInfo.clusterId}
            onChange={e => setBasicInfo({ ...basicInfo, clusterId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="">Select cluster</option>
            {clusters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text" value={basicInfo.location}
            onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            placeholder="e.g. Lekki, Lagos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
          <input
            type="text" value={basicInfo.siteAddress}
            onChange={e => setBasicInfo({ ...basicInfo, siteAddress: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            placeholder="e.g. 12B Admiralty Road, Lekki Phase 1"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={3} value={basicInfo.description}
          onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
          style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          placeholder="Project description..."
        />
      </div>
    </div>
  );

  // Step 2 — Schedule Builder
  const renderTaskTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = projectTasks.filter(t => t.parentTaskId === parentId);
    if (children.length === 0 && depth === 0) {
      return rootTasks.map(t => renderTaskTree(t.id, 1));
    }
    return children.flatMap(task => {
      const isExpanded = expanded.has(task.id);
      const hasChildren = projectTasks.some(t => t.parentTaskId === task.id);
      const paddingLeft = (task.level - 1) * 24 + 12;

      return (
        <div key={task.id}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm group"
            style={{
              paddingLeft: `${paddingLeft}px`,
              backgroundColor: task.level === 1 ? "#1C2333" : "transparent",
              color: task.level === 1 ? "white" : "#1A202C",
            }}
          >
            <button
              onClick={() => hasChildren && toggleExpand(task.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5" />
              )}
            </button>
            <span className="text-xs font-mono opacity-60 w-14 flex-shrink-0">{task.id}</span>
            <span className="flex-1 truncate font-medium">{task.name}</span>
            <span className="text-xs opacity-60 hidden sm:inline">
              {LEVEL_NAMES[task.level]}
            </span>
            <span className="text-xs opacity-60 hidden sm:inline">
              {fmtDate(task.plannedStart)} — {fmtDate(task.plannedEnd)}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {hasChildren && isExpanded && renderTaskTree(task.id, depth + 1)}
        </div>
      );
    });
  };

  const renderScheduleBuilder = () => (
    <div className="space-y-4">
      <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1A202C" }}>Task Hierarchy Builder</h2>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#E8973A" }}
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {projectTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs mt-1">Add Level 1–4 tasks to build your project schedule</p>
          </div>
        ) : (
          <div className="border rounded-lg" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ borderColor: "#E2E8F0" }}>
              <span className="w-3.5" />
              <span className="w-14">ID</span>
              <span className="flex-1">Task Name</span>
              <span className="hidden sm:inline w-28">Level</span>
              <span className="hidden sm:inline w-40">Dates</span>
              <span className="w-6" />
            </div>
            {renderTaskTree(null, 0)}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl w-full max-w-md" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="text-base font-bold" style={{ color: "#1A202C" }}>Add Task</h3>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  type="text" value={taskForm.name}
                  onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Substructure Works"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={taskForm.level}
                  onChange={e => {
                    const lvl = Number(e.target.value) as 1 | 2 | 3 | 4;
                    setTaskForm({ ...taskForm, level: lvl, parentTaskId: "" });
                  }}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  {[1, 2, 3, 4].map(l => (
                    <option key={l} value={l}>Level {l} — {LEVEL_NAMES[l]}</option>
                  ))}
                </select>
              </div>
              {taskForm.level > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Task</label>
                  <select
                    value={taskForm.parentTaskId}
                    onChange={e => setTaskForm({ ...taskForm, parentTaskId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  >
                    <option value="">Select parent...</option>
                    {projectTasks
                      .filter(t => t.level < taskForm.level && t.level >= 1)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {"—".repeat(t.level)} {t.name} ({t.id})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start</label>
                  <input
                    type="date" value={taskForm.plannedStart}
                    onChange={e => setTaskForm({ ...taskForm, plannedStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned End</label>
                  <input
                    type="date" value={taskForm.plannedEnd}
                    onChange={e => setTaskForm({ ...taskForm, plannedEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: "#E2E8F0" }}>
              <button
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600"
                style={{ borderColor: "#E2E8F0" }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="px-4 py-2 rounded-lg text-sm text-white font-medium"
                style={{ backgroundColor: "#E8973A" }}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 3 — Vendor Registration & Stage Assignment
  const renderResourceRegistration = () => {
    const stages = projectTasks.filter(t => t.level === 1);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>
            {isNewVendor ? "Register New Resource" : "Select Resource"}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Choose Resource</label>
            <select
              value={selectedExistingVendor}
              onChange={e => handleSelectExistingVendor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            >
              <option value="">— Select Resource —</option>
              {uniqueVendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} — {v.trade}</option>
              ))}
              <option value="__new__">Register New Resource</option>
            </select>
          </div>

          {selectedExistingVendor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                <input
                  type="text" value={vendorForm.name}
                  onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Alhaji Masonry Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                <select
                  value={vendorForm.trade}
                  onChange={e => setVendorForm({ ...vendorForm, trade: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  <option value="">Select trade</option>
                  {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                <select
                  value={vendorForm.contractType}
                  onChange={e => setVendorForm({ ...vendorForm, contractType: e.target.value as Vendor["contractType"] })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  <option value="Labor-only">Labor-only</option>
                  <option value="Supply & Install">Supply & Install</option>
                  <option value="Nominated Subcontractor">Nominated Subcontractor</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox" id="vendorNominated" checked={vendorForm.isNominated}
                  onChange={e => setVendorForm({ ...vendorForm, isNominated: e.target.checked })}
                  className="rounded" style={{ accentColor: "#E8973A" }}
                />
                <label htmlFor="vendorNominated" className="text-sm text-gray-700">Nominated by HAUZ</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Sum (₦)</label>
                <input
                  type="number" value={vendorForm.contractSum}
                  onChange={e => setVendorForm({ ...vendorForm, contractSum: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{blockLabel} Assignment</label>
                <select
                  value={vendorForm.blockAssignment}
                  onChange={e => setVendorForm({ ...vendorForm, blockAssignment: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  <option value="">— Select —</option>
                  {structureEntries.map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                  <option value="All / Site-wide">All / Site-wide</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skilled Workers</label>
                  <input
                    type="number" value={vendorForm.skilledCount}
                    onChange={e => setVendorForm({ ...vendorForm, skilledCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unskilled Workers</label>
                  <input
                    type="number" value={vendorForm.unskilledCount}
                    onChange={e => setVendorForm({ ...vendorForm, unskilledCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Man-days Estimate</label>
                <input
                  type="number" value={vendorForm.mandaysEstimate}
                  onChange={e => setVendorForm({ ...vendorForm, mandaysEstimate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={vendorForm.status}
                  onChange={e => setVendorForm({ ...vendorForm, status: e.target.value as Vendor["status"] })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  <option value="Awarded">Awarded</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={addVendor}
              disabled={!vendorForm.name || !vendorForm.trade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#E8973A" }}
            >
              <Plus className="w-4 h-4" /> Add to Project
            </button>
          </div>
        </div>

        {/* Stage Assignment */}
        {projectVendors.length > 0 && stages.length > 0 && (
          <div className="rounded-xl border p-5" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
            <h3 className="text-base font-bold mb-4" style={{ color: "#1A202C" }}>Assign Resources to Schedule Phases</h3>
            <p className="text-sm text-gray-500 mb-4">For each resource, select which stages of the schedule they will work on.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E2E8F0" }}>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500">Vendor</th>
                    {stages.map(s => (
                      <th key={s.id} className="text-center px-3 py-2.5 font-medium text-gray-500 min-w-[120px]">{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectVendors.map(v => (
                    <tr key={v.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{v.name}</td>
                      {stages.map(s => {
                        const assigned = vendorStageAssignments[v.id] || [];
                        const isChecked = assigned.includes(s.id);
                        return (
                          <td key={s.id} className="text-center px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleStageForVendor(v.id, s.id)}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: "#E8973A" }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Registered Vendors List */}
        {projectVendors.length > 0 && (
          <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#1A202C" }}>
                Registered Vendors ({projectVendors.length})
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "#E2E8F0" }}>
              {projectVendors.map(v => {
                const assignedStages = (vendorStageAssignments[v.id] || [])
                  .map(sid => stages.find(s => s.id === sid))
                  .filter(Boolean);
                return (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: "#E8973A" }}>
                        {v.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-500">{v.trade} · {v.contractType}</p>
                        {assignedStages.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Stages: {assignedStages.map(s => s!.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeVendor(v.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 4 — Calendar
  const renderCalendar = () => (
    <div className="space-y-4">
      <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Working Days & Hours</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => {
              const dayIdx = DAY_INDICES[i];
              const active = calendarData.workingDays.includes(dayIdx);
              return (
                <button
                  key={label}
                  onClick={() => toggleDay(dayIdx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? "text-white border-transparent"
                      : "text-gray-500 bg-white"
                  }`}
                  style={{
                    backgroundColor: active ? "#E8973A" : undefined,
                    borderColor: active ? "#E8973A" : "#E2E8F0",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours Start</label>
            <input
              type="time" value={calendarData.workingHoursStart}
              onChange={e => setCalendarData({ ...calendarData, workingHoursStart: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours End</label>
            <input
              type="time" value={calendarData.workingHoursEnd}
              onChange={e => setCalendarData({ ...calendarData, workingHoursEnd: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Holidays</h2>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date" value={newHoliday.date}
              onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text" value={newHoliday.label}
              onChange={e => setNewHoliday({ ...newHoliday, label: e.target.value })}
              placeholder="e.g. New Year"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
          <button
            onClick={addHoliday}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#E8973A" }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {calendarData.holidays.length > 0 ? (
          <div className="space-y-2">
            {calendarData.holidays.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                <span className="font-medium text-gray-900">{fmtDate(h.date)}</span>
                <span className="text-gray-600 flex-1 ml-3">{h.label}</span>
                <button onClick={() => removeHoliday(idx)} className="text-red-400 hover:text-red-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No holidays added</p>
        )}
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Site Shutdowns</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date" value={newShutdown.start}
              onChange={e => setNewShutdown({ ...newShutdown, start: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date" value={newShutdown.end}
              onChange={e => setNewShutdown({ ...newShutdown, end: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <div className="flex gap-2">
              <input
                type="text" value={newShutdown.label}
                onChange={e => setNewShutdown({ ...newShutdown, label: e.target.value })}
                placeholder="e.g. End of Year"
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
              />
              <button
                onClick={addShutdown}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#E8973A" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {calendarData.shutdowns.length > 0 ? (
          <div className="space-y-2">
            {calendarData.shutdowns.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                <span className="font-medium text-gray-900">{fmtDate(s.start)} — {fmtDate(s.end)}</span>
                <span className="text-gray-600 flex-1 ml-3">{s.label}</span>
                <button onClick={() => removeShutdown(idx)} className="text-red-400 hover:text-red-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No shutdowns added</p>
        )}
      </div>
    </div>
  );

  // Step 5 — Baseline
  const renderSummary = () => {
    const taskDates = projectTasks.length > 0
      ? (() => {
          const starts = projectTasks.map(t => new Date(t.plannedStart).getTime());
          const ends = projectTasks.map(t => new Date(t.plannedEnd).getTime());
          const minStart = new Date(Math.min(...starts)).toISOString().split("T")[0];
          const maxEnd = new Date(Math.max(...ends)).toISOString().split("T")[0];
          return `${fmtDate(minStart)} — ${fmtDate(maxEnd)}`;
        })()
      : null;
    const dateRange = taskDates || (basicInfo.plannedStartDate && basicInfo.plannedEndDate
        ? `${fmtDate(basicInfo.plannedStartDate)} — ${fmtDate(basicInfo.plannedEndDate)}`
        : "Not set");

    return (
      <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E8973A", color: "white" }}>
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1A202C" }}>Lock Baseline</h2>
            <p className="text-sm" style={{ color: "#718096" }}>
              Locking the baseline will freeze the current plan as your project baseline.
            </p>
          </div>
        </div>

        {/* Classification summary */}
        {projectSector && projectCategory && (
          <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E2E8F0" }}>
            <span className="font-medium text-gray-700">Project Type: </span>
            <span className="text-gray-600">{projectSector} &rarr; {projectCategory}</span>
            {projectDescriptor && <span className="text-gray-400"> — {projectDescriptor}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border p-4 text-center" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
            <p className="text-2xl font-bold" style={{ color: "#1A202C" }}>{projectTasks.length}</p>
            <p className="text-xs" style={{ color: "#718096" }}>Tasks</p>
          </div>
          <div className="rounded-lg border p-4 text-center" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
            <p className="text-2xl font-bold" style={{ color: "#1A202C" }}>{projectVendors.length}</p>
            <p className="text-xs" style={{ color: "#718096" }}>Vendors</p>
          </div>
          <div className="rounded-lg border p-4 text-center" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
            <p className="text-2xl font-bold" style={{ color: "#1A202C" }}>
              {calendarData.workingDays.length}/7
            </p>
            <p className="text-xs" style={{ color: "#718096" }}>Working Days</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm px-4 py-3 rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
            <span className="text-gray-600">Date Range</span>
            <span className="font-medium text-gray-900">{dateRange}</span>
          </div>
          <div className="flex items-center justify-between text-sm px-4 py-3 rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
            <span className="text-gray-600">Holidays Configured</span>
            <span className="font-medium text-gray-900">{calendarData.holidays.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm px-4 py-3 rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
            <span className="text-gray-600">Shutdowns Configured</span>
            <span className="font-medium text-gray-900">{calendarData.shutdowns.length}</span>
          </div>
        </div>

        <div className={`rounded-lg p-4 text-sm ${baselineLocked ? "bg-green-50 border border-green-200" : ""}`}>
          {baselineLocked ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Baseline has been locked successfully.</span>
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              Once locked, the planned dates and scope cannot be modified without a formal change request.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderBottomIndicator = () => (
    <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#718096" }}>
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(idx);
          const isCurrent = currentStep === idx;
          return (
            <span key={step.id} className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCompleted ? "bg-green-500" : isCurrent ? "" : "bg-gray-300"
                }`}
                style={isCurrent && !isCompleted ? { backgroundColor: "#E8973A" } : {}}
              />
              {idx < STEPS.length - 1 && (
                <span className={`w-3 h-px ${completedSteps.has(idx) ? "bg-green-500" : "bg-gray-300"}`} />
              )}
            </span>
          );
        })}
      </div>
      <span className="ml-2">Setup Progress: Step {currentStep + 1} of {STEPS.length}</span>
      {completedSteps.size === STEPS.length && (
        <span className="ml-1 text-green-600 font-medium">· Complete</span>
      )}
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F7F8FA" }} className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8973A", color: "white" }}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1A202C" }}>Project Setup</h1>
            <p className="text-sm" style={{ color: "#718096" }}>
              {project?.name || basicInfo.name || "New Project"} — Setup Wizard
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        {renderProgress()}
      </div>

      <div className="mb-6">
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderProjectType()}
        {currentStep === 2 && renderResourceRegistration()}
        {currentStep === 3 && renderScheduleBuilder()}
        {currentStep === 4 && renderCalendar()}
        {currentStep === 5 && renderSummary()}
      </div>

      <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div>
          {!isFirstStep && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium"
              style={{ borderColor: "#E2E8F0", color: "#718096" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#718096" }}>
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span className="w-px h-4" style={{ backgroundColor: "#E2E8F0" }} />
          <span>{STEPS[currentStep].label}</span>
        </div>
        <div>
          {isLastStep ? (
            <button
              onClick={handleCompleteSetup}
              disabled={baselineLocked}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: baselineLocked ? "#22C55E" : "#E8973A" }}
            >
              {baselineLocked ? (
                <><CheckCircle className="w-4 h-4" /> Completed</>
              ) : (
                <><Lock className="w-4 h-4" /> Lock Baseline</>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#E8973A" }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {renderBottomIndicator()}
      </div>
    </div>
  );
}
