import { useParams } from "react-router";
import { useState, useMemo, useRef } from "react";
import {
  CheckCircle, Circle, ArrowRight, ArrowLeft, Lock, Calendar,
  Building2, Users, Layers, FileText, Plus, X, Trash2, ChevronRight, ChevronDown, Tags, Download, Upload
} from "lucide-react";
import * as XLSX from "xlsx";
import { getProjectById, staffList, tradeTypes, clusters, tasks as allTasks, fmtDate, vendors as allVendors, defaultScheduleLevels, hrEmployees, materialInventory, equipmentInventory } from "./mockData";
import type { Task, Vendor, ProjectCalendar, Sector, ProjectStructureItem, ScheduleLevelConfig, HumanResource, HumanResourceSource, MaterialResource, EquipmentResource, ResourceAssignment } from "./types";
import { SECTOR_CATEGORIES, getBlockLabel, getStructureConfig, DEFAULT_WBS_LEVELS } from "./types";
import { useResources } from "../../contexts/ResourceContext";

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

  const { individualContractors } = useResources();
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

  // Resource assignments for Schedule Builder
  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>([]);
  const [assignModalTaskId, setAssignModalTaskId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ resourceType: "human" as "human" | "material" | "equipment", resourceId: "", plannedQty: 0, plannedCost: 0 });

  // Step 3 — Vendor Registration
  const [projectVendors, setProjectVendors] = useState<Vendor[]>([]);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR_FORM);
  const [selectedExistingVendor, setSelectedExistingVendor] = useState("");
  const [vendorStageAssignments, setVendorStageAssignments] = useState<Record<string, string[]>>({});
  const [resourceTab, setResourceTab] = useState<"human" | "material" | "equipment">("human");
  const [isNewVendor, setIsNewVendor] = useState(false);
  const [humanSubType, setHumanSubType] = useState<HumanResourceSource>("vendor");

  const EMPTY_STAFF_FORM = { name: "", trade: "", employeeId: "", dailyRate: 0, status: "Active" as const };
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [projectStaff, setProjectStaff] = useState<HumanResource[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const EMPTY_CONTRACTOR_FORM = { name: "", trade: "", payRate: 0, payRateUnit: "daily" as "daily" | "weekly" | "monthly" | "lump-sum", skilledCount: 0, unskilledCount: 0, mandaysEstimate: 0, status: "Awarded" as const };
  const [contractorForm, setContractorForm] = useState(EMPTY_CONTRACTOR_FORM);
  const [projectContractors, setProjectContractors] = useState<HumanResource[]>([]);
  const [selectedExistingContractor, setSelectedExistingContractor] = useState("");
  const [isNewContractor, setIsNewContractor] = useState(false);

  const EMPTY_MATERIAL_FORM = { name: "", category: "", unit: "", estimatedQty: 0, estimatedUnitCost: 0, procurementSource: "internal" as "internal" | "purchase", supplierName: "" };
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL_FORM);
  const [projectMaterials, setProjectMaterials] = useState<MaterialResource[]>([]);
  const [materialSource, setMaterialSource] = useState<"inventory" | "manual">("inventory");
  const [selectedMaterialInventoryId, setSelectedMaterialInventoryId] = useState("");

  const EMPTY_EQUIPMENT_FORM = { name: "", category: "", ownership: "company-owned" as "company-owned" | "rented" | "client-supplied", internalCostPerDay: 0, rentalCostPerDay: 0, rentalSupplier: "", estimatedDays: 0, status: "Available" as "Available" | "Assigned" | "Under Maintenance" };
  const [equipmentForm, setEquipmentForm] = useState(EMPTY_EQUIPMENT_FORM);
  const [projectEquipment, setProjectEquipment] = useState<EquipmentResource[]>([]);
  const [equipmentSource, setEquipmentSource] = useState<"fleet" | "manual">("fleet");
  const [selectedEquipmentFleetId, setSelectedEquipmentFleetId] = useState("");

  // HR list UI state
  const [hrSearch, setHrSearch] = useState("");
  const [hrSectionOpen, setHrSectionOpen] = useState({ employee: true, contractor: true, vendor: true });

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
    setResourceAssignments(prev => prev.filter(a => !idsToRemove.has(a.taskId)));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ["Level", "Task Name", "Parent Task ID", "Planned Start", "Planned End"],
      [1, "Substructure Works", "", "2026-01-15", "2026-03-15"],
      [2, "Excavation", "TSK-001", "2026-01-15", "2026-02-01"],
      [2, "Foundation", "TSK-001", "2026-02-02", "2026-03-15"],
      [1, "Superstructure Works", "", "2026-03-16", "2026-09-30"],
      [2, "Column & Slab", "TSK-004", "2026-03-16", "2026-06-30"],
      [3, "Ground Floor Slab", "TSK-005", "2026-03-16", "2026-04-30"],
      [3, "First Floor Slab", "TSK-005", "2026-05-01", "2026-06-30"],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Tasks");
    XLSX.writeFile(wb, "project_schedule_template.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        const newTasks: Task[] = [];
        let maxLvl = maxTaskId;
        for (let i = 1; i < rows.length; i++) {
          const [levelStr, name, parentId, start, end] = rows[i];
          const level = Number(levelStr);
          if (!name || isNaN(level) || level < 1 || level > 4) continue;
          maxLvl++;
          const prefix = LEVEL_PREFIX[level as 1 | 2 | 3 | 4];
          const id = `${prefix}-${String(maxLvl).padStart(3, "0")}`;
          const s = start || new Date().toISOString().split("T")[0];
          const e = end || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
          const dur = Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);
          newTasks.push({
            id, projectId: projectId!, parentTaskId: parentId || null,
            level: level as 1 | 2 | 3 | 4, name: String(name).trim(),
            plannedStart: s, plannedEnd: e, actualStart: null, actualEnd: null,
            plannedDuration: dur, actualDuration: null, percentComplete: 0,
            predecessorId: null, dependencyType: null, lagDays: 0,
            vendorId: null, ragStatus: "on-track", ragOverride: false, notes: "",
          });
        }
        if (newTasks.length > 0) {
          setProjectTasks(prev => [...prev, ...newTasks]);
          setExpanded(prev => {
            const next = new Set(prev);
            newTasks.forEach(t => { next.add(t.id); if (t.parentTaskId) next.add(t.parentTaskId); });
            return next;
          });
        }
      } catch (err) {
        console.error("Excel import failed", err);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  // Staff helpers
  const addStaff = () => {
    if (!selectedEmployeeId) return;
    const emp = hrEmployees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    if (projectStaff.some(s => s.employeeId === selectedEmployeeId)) return;
    const newStaff: HumanResource = {
      id: `STF-${String(projectStaff.length + 1).padStart(3, "0")}`,
      projectId: projectId!,
      source: "employee",
      name: `${emp.firstName} ${emp.lastName}`,
      trade: emp.role,
      employeeId: emp.id,
      dailyRate: emp.dailyRate,
      status: "Active",
      assignedWorkPackages: [],
      blockAssignment: "",
      mandaysEstimate: 0,
    };
    setProjectStaff(prev => [...prev, newStaff]);
    setSelectedEmployeeId("");
  };
  const removeStaff = (id: string) => setProjectStaff(prev => prev.filter(s => s.id !== id));

  // Contractor helpers
  const handleSelectExistingContractor = (id: string) => {
    setSelectedExistingContractor(id);
    if (id === "__new__") {
      setIsNewContractor(true);
      setContractorForm(EMPTY_CONTRACTOR_FORM);
    } else if (id === "") {
      setIsNewContractor(false);
      setContractorForm(EMPTY_CONTRACTOR_FORM);
    } else {
      setIsNewContractor(false);
      const c = individualContractors.find(c => c.id === id);
      if (c) {
        setContractorForm({
          name: c.name, trade: c.trade, payRate: c.payRate,
          payRateUnit: c.payRateUnit, skilledCount: c.skilledCount,
          unskilledCount: c.unskilledCount, mandaysEstimate: c.manDays,
          status: c.status,
        });
      }
    }
  };
  const addContractor = () => {
    if (!contractorForm.name || !contractorForm.trade) return;
    const newCon: HumanResource = {
      id: `CON-${String(projectContractors.length + 1).padStart(3, "0")}`,
      projectId: projectId!,
      source: "individual-contractor",
      name: contractorForm.name,
      trade: contractorForm.trade,
      payRate: contractorForm.payRate || undefined,
      payRateUnit: contractorForm.payRateUnit,
      skilledCount: contractorForm.skilledCount,
      unskilledCount: contractorForm.unskilledCount,
      mandaysEstimate: contractorForm.mandaysEstimate,
      status: contractorForm.status,
      assignedWorkPackages: [],
      blockAssignment: "",
    };
    setProjectContractors(prev => [...prev, newCon]);
    setContractorForm(EMPTY_CONTRACTOR_FORM);
    setSelectedExistingContractor("");
    setIsNewContractor(false);
  };
  const removeContractor = (id: string) => setProjectContractors(prev => prev.filter(c => c.id !== id));

  // Stage assignment toggle (unified for all human resources)
  const [resourceStageAssignments, setResourceStageAssignments] = useState<Record<string, string[]>>({});
  const toggleResourceStage = (resourceId: string, stageId: string) => {
    setResourceStageAssignments(prev => {
      const current = prev[resourceId] || [];
      return { ...prev, [resourceId]: current.includes(stageId) ? current.filter(s => s !== stageId) : [...current, stageId] };
    });
  };

  // Material helpers
  const addMaterial = () => {
    if (materialSource === "inventory") {
      if (!selectedMaterialInventoryId || !materialForm.estimatedQty) return;
      const inv = materialInventory.find(i => i.id === selectedMaterialInventoryId);
      if (!inv) return;
      const newMat: MaterialResource = {
        id: `MAT-${String(projectMaterials.length + 1).padStart(3, "0")}`,
        projectId: projectId!,
        name: inv.name,
        category: inv.category,
        unit: inv.unit,
        estimatedQty: materialForm.estimatedQty,
        estimatedUnitCost: inv.defaultUnitCost,
        totalEstimatedCost: materialForm.estimatedQty * inv.defaultUnitCost,
        procurementSource: "internal",
      };
      setProjectMaterials(prev => [...prev, newMat]);
      setSelectedMaterialInventoryId("");
      setMaterialForm({ ...EMPTY_MATERIAL_FORM, estimatedQty: 0 });
      return;
    }
    if (!materialForm.name || !materialForm.category || !materialForm.unit) return;
    const newMat: MaterialResource = {
      id: `MAT-${String(projectMaterials.length + 1).padStart(3, "0")}`,
      projectId: projectId!,
      name: materialForm.name,
      category: materialForm.category,
      unit: materialForm.unit,
      estimatedQty: materialForm.estimatedQty,
      estimatedUnitCost: materialForm.estimatedUnitCost,
      totalEstimatedCost: materialForm.estimatedQty * materialForm.estimatedUnitCost,
      procurementSource: materialForm.procurementSource,
      supplierId: materialForm.supplierName || undefined,
    };
    setProjectMaterials(prev => [...prev, newMat]);
    setMaterialForm(EMPTY_MATERIAL_FORM);
  };
  const removeMaterial = (id: string) => setProjectMaterials(prev => prev.filter(m => m.id !== id));

  // Equipment helpers
  const addEquipment = () => {
    if (equipmentSource === "fleet") {
      if (!selectedEquipmentFleetId || !equipmentForm.estimatedDays) return;
      const inv = equipmentInventory.find(e => e.id === selectedEquipmentFleetId);
      if (!inv) return;
      const newEquip: EquipmentResource = {
        id: `EQ-${String(projectEquipment.length + 1).padStart(3, "0")}`,
        projectId: projectId!,
        name: inv.name,
        category: inv.category,
        ownership: "company-owned",
        internalCostPerDay: inv.defaultInternalCostPerDay,
        estimatedDays: equipmentForm.estimatedDays,
        totalEstimatedCost: inv.defaultInternalCostPerDay * equipmentForm.estimatedDays,
        status: inv.status === "Available" ? "Available" : "Assigned",
      };
      setProjectEquipment(prev => [...prev, newEquip]);
      setSelectedEquipmentFleetId("");
      setEquipmentForm({ ...EMPTY_EQUIPMENT_FORM, estimatedDays: 0 });
      return;
    }
    if (!equipmentForm.name || !equipmentForm.category) return;
    const isCompanyOwned = equipmentForm.ownership === "company-owned";
    const costPerDay = isCompanyOwned ? equipmentForm.internalCostPerDay : equipmentForm.rentalCostPerDay;
    const newEquip: EquipmentResource = {
      id: `EQ-${String(projectEquipment.length + 1).padStart(3, "0")}`,
      projectId: projectId!,
      name: equipmentForm.name,
      category: equipmentForm.category,
      ownership: equipmentForm.ownership,
      internalCostPerDay: isCompanyOwned ? equipmentForm.internalCostPerDay || undefined : undefined,
      rentalCostPerDay: !isCompanyOwned ? equipmentForm.rentalCostPerDay || undefined : undefined,
      rentalSupplier: !isCompanyOwned ? equipmentForm.rentalSupplier || undefined : undefined,
      estimatedDays: equipmentForm.estimatedDays,
      totalEstimatedCost: (costPerDay || 0) * equipmentForm.estimatedDays,
      status: equipmentForm.status,
    };
    setProjectEquipment(prev => [...prev, newEquip]);
    setEquipmentForm(EMPTY_EQUIPMENT_FORM);
    setSelectedEquipmentFleetId("");
  };
  const removeEquipment = (id: string) => setProjectEquipment(prev => prev.filter(e => e.id !== id));

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
            {individualContractors.map(c => <option key={c.id} value={c.name}>{c.name} (Contractor)</option>)}
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
              onClick={() => setAssignModalTaskId(task.id)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-orange-100 text-orange-600 transition-opacity relative"
              title="Assign resources"
            >
              <Users className="w-3.5 h-3.5" />
              {resourceAssignments.filter(a => a.taskId === task.id).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {resourceAssignments.filter(a => a.taskId === task.id).length}
                </span>
              )}
            </button>
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
          <div className="flex gap-2">
            <button onClick={downloadExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E2E8F0", color: "#4A5568" }}
            >
              <Download className="w-4 h-4" /> Template
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer"
              style={{ borderColor: "#E2E8F0", color: "#4A5568" }}
            >
              <Upload className="w-4 h-4" /> Import Excel
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />
            </label>
          </div>
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

      {/* Assign Resources Modal */}
      {assignModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl w-full max-w-lg" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="text-base font-bold" style={{ color: "#1A202C" }}>
                Assign Resources — {projectTasks.find(t => t.id === assignModalTaskId)?.name}
              </h3>
              <button onClick={() => setAssignModalTaskId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Existing assignments */}
              {resourceAssignments.filter(a => a.taskId === assignModalTaskId).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Assigned Resources
                    <span className="text-xs text-gray-400 font-normal">({resourceAssignments.filter(a => a.taskId === assignModalTaskId).length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {resourceAssignments.filter(a => a.taskId === assignModalTaskId).map(ass => {
                      const resName = ass.resourceType === "human"
                        ? ([...projectStaff, ...projectContractors, ...projectVendors.map(v => ({ id: v.id, name: v.name, trade: v.trade }))] as { id: string; name: string; trade?: string }[]).find(r => r.id === (ass.humanResourceId || ass.materialResourceId || ass.equipmentResourceId))?.name || "Unknown"
                        : ass.resourceType === "material"
                          ? projectMaterials.find(m => m.id === ass.materialResourceId)?.name || "Unknown"
                          : projectEquipment.find(e => e.id === ass.equipmentResourceId)?.name || "Unknown";
                      const badgeColor = ass.resourceType === "human" ? "bg-blue-100 text-blue-700" : ass.resourceType === "material" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";
                      return (
                        <div key={ass.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm border" style={{ borderColor: "#E2E8F0" }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${badgeColor}`}>
                              {ass.resourceType === "human" ? "H" : ass.resourceType === "material" ? "M" : "E"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{resName}</p>
                              <p className="text-xs text-gray-500 capitalize">{ass.resourceType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{ass.plannedQty} × {ass.plannedCost > 0 ? `₦${ass.plannedCost.toLocaleString()}` : "N/A"}</p>
                              <p className="text-xs text-gray-400">Total: ₦{((ass.plannedCost || 0) * ass.plannedQty).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setResourceAssignments(prev => prev.filter(a => a.id !== ass.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add new assignment */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Assign New Resource
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Resource Type</label>
                    <div className="flex gap-2">
                      {(["human", "material", "equipment"] as const).map(rt => (
                        <button
                          key={rt}
                          onClick={() => setAssignForm({ ...assignForm, resourceType: rt, resourceId: "" })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            assignForm.resourceType === rt
                              ? rt === "human" ? "bg-blue-50 border-blue-400 text-blue-700"
                                : rt === "material" ? "bg-green-50 border-green-400 text-green-700"
                                : "bg-amber-50 border-amber-400 text-amber-700"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {rt === "human" ? "Human" : rt === "material" ? "Material" : "Equipment"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Resource</label>
                    <select
                      value={assignForm.resourceId}
                      onChange={e => setAssignForm({ ...assignForm, resourceId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                    >
                      <option value="">Select…</option>
                      {assignForm.resourceType === "human" && [...projectStaff, ...projectContractors, ...projectVendors].map(r => (
                        <option key={r.id} value={r.id}>{"name" in r ? r.name : r.id} {"trade" in r && r.trade ? `— ${r.trade}` : ""}</option>
                      ))}
                      {assignForm.resourceType === "material" && projectMaterials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                      ))}
                      {assignForm.resourceType === "equipment" && projectEquipment.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                      ))}
                    </select>
                    {assignForm.resourceType === "human" && projectStaff.length + projectContractors.length + projectVendors.length === 0 && <p className="text-xs text-gray-400 mt-1">No human resources registered. Go to Resources step first.</p>}
                    {assignForm.resourceType === "material" && projectMaterials.length === 0 && <p className="text-xs text-gray-400 mt-1">No materials registered. Go to Resources step first.</p>}
                    {assignForm.resourceType === "equipment" && projectEquipment.length === 0 && <p className="text-xs text-gray-400 mt-1">No equipment registered. Go to Resources step first.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Planned Quantity</label>
                      <input type="number" min={0} value={assignForm.plannedQty} onChange={e => setAssignForm({ ...assignForm, plannedQty: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Planned Cost (₦)</label>
                      <input type="number" min={0} value={assignForm.plannedCost} onChange={e => setAssignForm({ ...assignForm, plannedCost: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!assignForm.resourceId || !assignModalTaskId) return;
                      const newAssignment: ResourceAssignment = {
                        id: `RA-${Date.now()}`,
                        taskId: assignModalTaskId,
                        projectId: projectId || "",
                        resourceType: assignForm.resourceType,
                        ...(assignForm.resourceType === "human" ? { humanResourceId: assignForm.resourceId } : {}),
                        ...(assignForm.resourceType === "material" ? { materialResourceId: assignForm.resourceId } : {}),
                        ...(assignForm.resourceType === "equipment" ? { equipmentResourceId: assignForm.resourceId } : {}),
                        plannedQty: assignForm.plannedQty,
                        plannedCost: assignForm.plannedCost,
                      };
                      setResourceAssignments(prev => [...prev, newAssignment]);
                      setAssignForm({ resourceType: "human", resourceId: "", plannedQty: 0, plannedCost: 0 });
                    }}
                    disabled={!assignForm.resourceId}
                    className="w-full px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-40"
                    style={{ backgroundColor: "#E8973A" }}
                  >
                    Add to Task
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-5 border-t" style={{ borderColor: "#E2E8F0" }}>
              <button onClick={() => setAssignModalTaskId(null)} className="px-4 py-2 rounded-lg border text-sm text-gray-600" style={{ borderColor: "#E2E8F0" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 3 — Vendor Registration & Stage Assignment
  const renderResourceRegistration = () => {
    const stages = projectTasks.filter(t => t.level === 1);

    const allHumanResources = [
      ...projectStaff.map(s => ({ ...s, _subtype: "Employee" as const })),
      ...projectContractors.map(c => ({ ...c, _subtype: "Contractor" as const })),
      ...projectVendors.map(v => ({ ...v, id: v.id, name: v.name, trade: v.trade, _subtype: "Vendor" as const, extra: v.contractType })),
    ];

    const materialCategories = ["Aggregates", "Reinforcement", "Concrete", "Steel", "Finishing", "Plumbing", "Electrical", "Roofing", "Lumber / Formwork", "Hardware", "Paint & Coatings", "Waterproofing", "Insulation", "Other"];
    const materialUnits = ["bags", "tonnes", "kg", "litres", "gallons", "m³", "m²", "linear metres", "pieces", "rolls", "sheets", "pails", "drums"];

    const equipmentCategories = ["Earthwork", "Lifting", "Concreting", "Compaction", "Piling", "Transport", "Generators / Power", "Pumping", "Safety", "Other"];
    const equipmentStatuses = ["Available", "Assigned", "Under Maintenance"];

    const SubPill = ({ label, value }: { label: string; value: HumanResourceSource }) => (
      <button onClick={() => setHumanSubType(value)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          humanSubType === value ? "bg-white text-gray-900 shadow-sm border" : "text-gray-500 hover:text-gray-700 border border-transparent"
        }`}
      >
        {label}
      </button>
    );

    return (
      <div className="space-y-4">
        {/* Resource Type Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-md">
          {(["human", "material", "equipment"] as const).map(tab => (
            <button key={tab} onClick={() => setResourceTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                resourceTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "human" ? "Human Resources" : tab === "material" ? "Materials" : "Equipment"}
            </button>
          ))}
        </div>

        {/* ──── HUMAN RESOURCES ──── */}
        {resourceTab === "human" && (<>
          {/* Sub-type pills */}
          <div className="flex gap-1.5">
            <SubPill label="Employees" value="employee" />
            <SubPill label="Individual Contractors" value="individual-contractor" />
            <SubPill label="Vendors" value="vendor" />
          </div>

          {/* ── Employee Form ── */}
          {humanSubType === "employee" && (
            <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Select Employee</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Employee from HR</label>
                <select value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">— Select Employee —</option>
                  {hrEmployees.filter(e => !projectStaff.some(s => s.employeeId === e.id)).map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.role}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const emp = hrEmployees.find(e => e.id === selectedEmployeeId);
                if (!emp) return null;
                return (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={`${emp.firstName} ${emp.lastName}`} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input type="text" value={emp.role} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input type="text" value={emp.id} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₦)</label>
                      <input type="text" value={emp.dailyRate.toLocaleString()} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-end mt-4">
                <button onClick={addStaff} disabled={!selectedEmployeeId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#E8973A" }}>
                  <Plus className="w-4 h-4" /> Assign to Project
                </button>
              </div>
            </div>
          )}

          {/* ── Individual Contractor Form ── */}
          {humanSubType === "individual-contractor" && (
            <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>
                {isNewContractor ? "Register Individual Contractor" : "Select Contractor"}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Contractor</label>
                <select value={selectedExistingContractor}
                  onChange={e => handleSelectExistingContractor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">— Select Contractor —</option>
                  {individualContractors.filter(c => !projectContractors.some(pc => pc.name === c.name)).map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.trade}</option>
                  ))}
                  <option value="__new__">Register New Contractor</option>
                </select>
              </div>
              {(isNewContractor || selectedExistingContractor) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={contractorForm.name}
                      onChange={e => setContractorForm({ ...contractorForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                      placeholder="e.g. Babatunde Welder" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                    <select value={contractorForm.trade}
                      onChange={e => setContractorForm({ ...contractorForm, trade: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="">Select trade</option>
                      {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pay Rate (₦)</label>
                    <input type="number" value={contractorForm.payRate || ""}
                      onChange={e => setContractorForm({ ...contractorForm, payRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                      placeholder="e.g. 25000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate Unit</label>
                    <select value={contractorForm.payRateUnit}
                      onChange={e => setContractorForm({ ...contractorForm, payRateUnit: e.target.value as "daily" | "weekly" | "monthly" | "lump-sum" })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="lump-sum">Lump Sum</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skilled Workers</label>
                      <input type="number" value={contractorForm.skilledCount || ""}
                        onChange={e => setContractorForm({ ...contractorForm, skilledCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unskilled Workers</label>
                      <input type="number" value={contractorForm.unskilledCount || ""}
                        onChange={e => setContractorForm({ ...contractorForm, unskilledCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Man-days Estimate</label>
                    <input type="number" value={contractorForm.mandaysEstimate || ""}
                      onChange={e => setContractorForm({ ...contractorForm, mandaysEstimate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={contractorForm.status}
                      onChange={e => setContractorForm({ ...contractorForm, status: e.target.value as "Awarded" | "Active" | "Completed" | "Terminated" })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="Awarded">Awarded</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={addContractor} disabled={!contractorForm.name || !contractorForm.trade}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#E8973A" }}>
                  <Plus className="w-4 h-4" /> {isNewContractor ? "Add Contractor" : "Assign to Project"}
                </button>
              </div>
            </div>
          )}

          {/* ── Vendor Form (existing) ── */}
          {humanSubType === "vendor" && (
            <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>
                {isNewVendor ? "Register New Vendor" : "Select Vendor"}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Vendor</label>
                <select value={selectedExistingVendor}
                  onChange={e => handleSelectExistingVendor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">— Select Vendor —</option>
                  {uniqueVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {v.trade}</option>
                  ))}
                  <option value="__new__">Register New Vendor</option>
                </select>
              </div>
              {selectedExistingVendor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input type="text" value={vendorForm.name}
                      onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                      placeholder="e.g. Alhaji Masonry Services" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                    <select value={vendorForm.trade}
                      onChange={e => setVendorForm({ ...vendorForm, trade: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="">Select trade</option>
                      {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                    <select value={vendorForm.contractType}
                      onChange={e => setVendorForm({ ...vendorForm, contractType: e.target.value as Vendor["contractType"] })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="Labor-only">Labor-only</option>
                      <option value="Supply & Install">Supply & Install</option>
                      <option value="Nominated Subcontractor">Nominated Subcontractor</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="vendorNominated" checked={vendorForm.isNominated}
                      onChange={e => setVendorForm({ ...vendorForm, isNominated: e.target.checked })}
                      className="rounded" style={{ accentColor: "#E8973A" }} />
                    <label htmlFor="vendorNominated" className="text-sm text-gray-700">Nominated Subcontractor</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Sum (₦)</label>
                    <input type="number" value={vendorForm.contractSum}
                      onChange={e => setVendorForm({ ...vendorForm, contractSum: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{blockLabel} Assignment</label>
                    <select value={vendorForm.blockAssignment}
                      onChange={e => setVendorForm({ ...vendorForm, blockAssignment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
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
                      <input type="number" value={vendorForm.skilledCount}
                        onChange={e => setVendorForm({ ...vendorForm, skilledCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unskilled Workers</label>
                      <input type="number" value={vendorForm.unskilledCount}
                        onChange={e => setVendorForm({ ...vendorForm, unskilledCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Man-days Estimate</label>
                    <input type="number" value={vendorForm.mandaysEstimate}
                      onChange={e => setVendorForm({ ...vendorForm, mandaysEstimate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={vendorForm.status}
                      onChange={e => setVendorForm({ ...vendorForm, status: e.target.value as Vendor["status"] })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                      <option value="Awarded">Awarded</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={addVendor} disabled={!vendorForm.name || !vendorForm.trade}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#E8973A" }}>
                  <Plus className="w-4 h-4" /> Add Vendor
                </button>
              </div>
            </div>
          )}

          {/* Stage Assignment — only when humanSubType === "vendor" */}
          {humanSubType === "vendor" && projectVendors.length > 0 && stages.length > 0 && (
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
                          return (
                            <td key={s.id} className="text-center px-3 py-2.5">
                              <input type="checkbox" checked={assigned.includes(s.id)}
                                onChange={() => toggleStageForVendor(v.id, s.id)}
                                className="w-4 h-4 rounded" style={{ accentColor: "#E8973A" }} />
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

          {/* Registered list — show all human resources */}
          {allHumanResources.length > 0 && (
            <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
              <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "#E2E8F0" }}>
                <h3 className="text-sm font-semibold" style={{ color: "#1A202C" }}>
                  Registered Human Resources ({allHumanResources.length})
                </h3>
                <input type="text" value={hrSearch} onChange={e => setHrSearch(e.target.value)} placeholder="Search resources..." className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA", maxWidth: 200 }} />
              </div>
              <div className="divide-y" style={{ borderColor: "#E2E8F0" }}>
                {/* Section: Employees */}
                {projectStaff.filter(s => !hrSearch || s.name.toLowerCase().includes(hrSearch.toLowerCase()) || s.trade.toLowerCase().includes(hrSearch.toLowerCase())).length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 flex items-center gap-2 cursor-pointer select-none" onClick={() => setHrSection(!hrSectionOpen.employee)}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Employees
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{projectStaff.length}</span>
                      {hrSectionOpen.employee ? <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />}
                    </div>
                    {hrSectionOpen.employee && projectStaff.filter(s => !hrSearch || s.name.toLowerCase().includes(hrSearch.toLowerCase()) || s.trade.toLowerCase().includes(hrSearch.toLowerCase())).map(s => (
                      <div key={s.id} className="flex items-center justify-between px-5 py-2.5 text-sm pl-10">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#3B82F6" }}>{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                            <p className="text-[11px] text-gray-500">{s.trade}{s.dailyRate ? ` · ₦${s.dailyRate.toLocaleString()}/day` : ""}</p>
                          </div>
                        </div>
                        <button onClick={() => removeStaff(s.id)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Section: Individual Contractors */}
                {projectContractors.filter(c => !hrSearch || c.name.toLowerCase().includes(hrSearch.toLowerCase()) || c.trade.toLowerCase().includes(hrSearch.toLowerCase())).length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 flex items-center gap-2 cursor-pointer select-none" onClick={() => setHrSection(!hrSectionOpen.contractor)}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Contractors
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{projectContractors.length}</span>
                      {hrSectionOpen.contractor ? <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />}
                    </div>
                    {hrSectionOpen.contractor && projectContractors.filter(c => !hrSearch || c.name.toLowerCase().includes(hrSearch.toLowerCase()) || c.trade.toLowerCase().includes(hrSearch.toLowerCase())).map(c => (
                      <div key={c.id} className="flex items-center justify-between px-5 py-2.5 text-sm pl-10">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#8B5CF6" }}>{c.name.charAt(0)}</div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                            <p className="text-[11px] text-gray-500">{c.trade}{c.payRate ? ` · ₦${c.payRate.toLocaleString()}/${c.payRateUnit}` : ""} · {c.skilledCount + c.unskilledCount} workers</p>
                          </div>
                        </div>
                        <button onClick={() => removeContractor(c.id)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Section: Vendors */}
                {projectVendors.filter(v => !hrSearch || v.name.toLowerCase().includes(hrSearch.toLowerCase()) || v.trade.toLowerCase().includes(hrSearch.toLowerCase())).length > 0 && (
                  <div>
                    <div className="px-5 py-2 bg-gray-50 flex items-center gap-2 cursor-pointer select-none" onClick={() => setHrSection(!hrSectionOpen.vendor)}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Vendors
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{projectVendors.length}</span>
                      {hrSectionOpen.vendor ? <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />}
                    </div>
                    {hrSectionOpen.vendor && projectVendors.filter(v => !hrSearch || v.name.toLowerCase().includes(hrSearch.toLowerCase()) || v.trade.toLowerCase().includes(hrSearch.toLowerCase())).map(v => {
                      const assignedStages = (vendorStageAssignments[v.id] || [])
                        .map(sid => stages.find(s => s.id === sid))
                        .filter(Boolean);
                      return (
                        <div key={v.id} className="flex items-center justify-between px-5 py-2.5 text-sm pl-10">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#E8973A" }}>{v.name.charAt(0)}</div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{v.name}</p>
                              <p className="text-[11px] text-gray-500">{v.trade} · {v.contractType}</p>
                              {assignedStages.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5 flex gap-1 flex-wrap">
                                  {assignedStages.map(s => (
                                    <span key={s!.id} className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{s!.name}</span>
                                  ))}
                                </p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeVendor(v.id)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Empty search */}
                {allHumanResources.length > 0 && projectStaff.filter(s => !hrSearch || s.name.toLowerCase().includes(hrSearch.toLowerCase())).length === 0 && projectContractors.filter(c => !hrSearch || c.name.toLowerCase().includes(hrSearch.toLowerCase())).length === 0 && projectVendors.filter(v => !hrSearch || v.name.toLowerCase().includes(hrSearch.toLowerCase())).length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">No resources match your search.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ──── MATERIALS ──── */}
      {resourceTab === "material" && (<>
        <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Add Material Resource</h2>
          {/* Source toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs mb-4">
            {(["inventory", "manual"] as const).map(src => (
              <button key={src} onClick={() => { setMaterialSource(src); setSelectedMaterialInventoryId(""); setMaterialForm(EMPTY_MATERIAL_FORM); }}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  materialSource === src ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {src === "inventory" ? "From Inventory" : "New Material"}
              </button>
            ))}
          </div>
          {materialSource === "inventory" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Material from Inventory</label>
                <select value={selectedMaterialInventoryId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedMaterialInventoryId(id);
                    if (id) {
                      const inv = materialInventory.find(i => i.id === id);
                      if (inv) setMaterialForm({ ...materialForm, name: inv.name, category: inv.category, unit: inv.unit, estimatedUnitCost: inv.defaultUnitCost, procurementSource: "internal" });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">— Select from inventory —</option>
                  {materialInventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.inStock} {i.unit} in stock) — ₦{i.defaultUnitCost.toLocaleString()}/{i.unit}</option>
                  ))}
                </select>
              </div>
              {selectedMaterialInventoryId && (() => {
                const inv = materialInventory.find(i => i.id === selectedMaterialInventoryId);
                if (!inv) return null;
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity</label>
                        <input type="number" value={materialForm.estimatedQty || ""}
                          onChange={e => setMaterialForm({ ...materialForm, estimatedQty: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                          placeholder="e.g. 500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₦) — from inventory</label>
                        <input type="text" value={`₦${inv.defaultUnitCost.toLocaleString()}`} disabled
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-500" style={{ borderColor: "#E2E8F0" }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">In Stock</label>
                        <input type="text" value={`${inv.inStock} ${inv.unit}`} disabled
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-500" style={{ borderColor: "#E2E8F0" }} />
                      </div>
                    </div>
                    {materialForm.estimatedQty > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Estimated Total: <span className="font-semibold text-gray-900">₦{(materialForm.estimatedQty * inv.defaultUnitCost).toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">(company stock — cost auto-calculated)</span>
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                <input type="text" value={materialForm.name}
                  onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Cement (Grade 42.5)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={materialForm.category}
                  onChange={e => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">Select category</option>
                  {materialCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                <select value={materialForm.unit}
                  onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">Select unit</option>
                  {materialUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity</label>
                <input type="number" value={materialForm.estimatedQty || ""}
                  onChange={e => setMaterialForm({ ...materialForm, estimatedQty: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Unit Cost (₦)</label>
                <input type="number" value={materialForm.estimatedUnitCost || ""}
                  onChange={e => setMaterialForm({ ...materialForm, estimatedUnitCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. 5500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Source</label>
                <select value={materialForm.procurementSource}
                  onChange={e => setMaterialForm({ ...materialForm, procurementSource: e.target.value as "internal" | "purchase" })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="purchase">Purchase (external)</option>
                  <option value="internal">Internal / Client-supplied</option>
                </select>
              </div>
              {materialForm.procurementSource === "purchase" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input type="text" value={materialForm.supplierName}
                    onChange={e => setMaterialForm({ ...materialForm, supplierName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                    placeholder="e.g. Dangote Cement" />
                </div>
              )}
            </div>
          )}
          {materialSource === "manual" && materialForm.estimatedQty > 0 && materialForm.estimatedUnitCost > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Estimated Total: <span className="font-semibold text-gray-900">₦{(materialForm.estimatedQty * materialForm.estimatedUnitCost).toLocaleString()}</span>
            </p>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={addMaterial} disabled={materialSource === "inventory" ? !selectedMaterialInventoryId || !materialForm.estimatedQty : !materialForm.name || !materialForm.category || !materialForm.unit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#E8973A" }}>
              <Plus className="w-4 h-4" /> {materialSource === "inventory" ? "Add from Inventory" : "Add Material"}
            </button>
          </div>
        </div>

        {/* Registered Materials List */}
        {projectMaterials.length > 0 && (
          <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#1A202C" }}>Registered Materials ({projectMaterials.length})</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "#E2E8F0" }}>
              {projectMaterials.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#10B981" }}>{m.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.category} · {m.estimatedQty} {m.unit} · ₦{m.estimatedUnitCost.toLocaleString()}/{m.unit}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Total: ₦{m.totalEstimatedCost.toLocaleString()} · {m.procurementSource === "purchase" ? "Purchased" : "Internal"}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMaterial(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}

      {/* ──── EQUIPMENT ──── */}
      {resourceTab === "equipment" && (<>
        <div className="rounded-xl border p-6" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1A202C" }}>Add Equipment Resource</h2>
          {/* Source toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs mb-4">
            {(["fleet", "manual"] as const).map(src => (
              <button key={src} onClick={() => { setEquipmentSource(src); setSelectedEquipmentFleetId(""); setEquipmentForm(EMPTY_EQUIPMENT_FORM); }}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  equipmentSource === src ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {src === "fleet" ? "From Company Fleet" : "New Equipment"}
              </button>
            ))}
          </div>
          {equipmentSource === "fleet" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Equipment from Fleet</label>
                <select value={selectedEquipmentFleetId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedEquipmentFleetId(id);
                    if (id) {
                      const inv = equipmentInventory.find(i => i.id === id);
                      if (inv) setEquipmentForm({ ...equipmentForm, name: inv.name, category: inv.category, internalCostPerDay: inv.defaultInternalCostPerDay });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">— Select from fleet —</option>
                  {equipmentInventory.map(e => (
                    <option key={e.id} value={e.id}>{e.name} — {e.category} ({e.status})</option>
                  ))}
                </select>
              </div>
              {selectedEquipmentFleetId && (() => {
                const inv = equipmentInventory.find(e => e.id === selectedEquipmentFleetId);
                if (!inv) return null;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days on Site</label>
                      <input type="number" value={equipmentForm.estimatedDays || ""}
                        onChange={e => setEquipmentForm({ ...equipmentForm, estimatedDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                        placeholder="e.g. 180" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Internal Cost per Day — from fleet</label>
                      <input type="text" value={`₦${inv.defaultInternalCostPerDay.toLocaleString()}`} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-500" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      <input type="text" value={inv.status} disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-500" style={{ borderColor: "#E2E8F0" }} />
                    </div>
                  </div>
                );
              })()}
              {equipmentSource === "fleet" && selectedEquipmentFleetId && equipmentForm.estimatedDays > 0 && (() => {
                const inv = equipmentInventory.find(e => e.id === selectedEquipmentFleetId);
                if (!inv) return null;
                return (
                  <p className="text-sm text-gray-500 mt-2">
                    Estimated Total: <span className="font-semibold text-gray-900">₦{(inv.defaultInternalCostPerDay * equipmentForm.estimatedDays).toLocaleString()}</span>
                    <span className="text-gray-400 ml-2">(company fleet — cost auto-calculated)</span>
                  </p>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
                <input type="text" value={equipmentForm.name}
                  onChange={e => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Tower Crane" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={equipmentForm.category}
                  onChange={e => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="">Select category</option>
                  {equipmentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
                <select value={equipmentForm.ownership}
                  onChange={e => setEquipmentForm({ ...equipmentForm, ownership: e.target.value as "company-owned" | "rented" | "client-supplied" })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  <option value="company-owned">Company-owned</option>
                  <option value="rented">Rented / Hired</option>
                  <option value="client-supplied">Client-supplied</option>
                </select>
              </div>
              {equipmentForm.ownership === "company-owned" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Cost per Day (₦)</label>
                  <input type="number" value={equipmentForm.internalCostPerDay || ""}
                    onChange={e => setEquipmentForm({ ...equipmentForm, internalCostPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                    placeholder="e.g. 150000" />
                </div>
              )}
              {equipmentForm.ownership === "rented" && (<>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rental Cost per Day (₦)</label>
                  <input type="number" value={equipmentForm.rentalCostPerDay || ""}
                    onChange={e => setEquipmentForm({ ...equipmentForm, rentalCostPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                    placeholder="e.g. 120000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rental Supplier</label>
                  <input type="text" value={equipmentForm.rentalSupplier}
                    onChange={e => setEquipmentForm({ ...equipmentForm, rentalSupplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                    placeholder="e.g. Mario Equipment Ltd" />
                </div>
              </>)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days on Site</label>
                <input type="number" value={equipmentForm.estimatedDays || ""}
                  onChange={e => setEquipmentForm({ ...equipmentForm, estimatedDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. 180" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={equipmentForm.status}
                  onChange={e => setEquipmentForm({ ...equipmentForm, status: e.target.value as "Available" | "Assigned" | "Under Maintenance" })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}>
                  {equipmentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
          {equipmentSource === "manual" && equipmentForm.estimatedDays > 0 && (equipmentForm.internalCostPerDay > 0 || equipmentForm.rentalCostPerDay > 0) && (
            <p className="text-sm text-gray-500 mt-3">
              Estimated Total: <span className="font-semibold text-gray-900">₦{((equipmentForm.ownership === "company-owned" ? equipmentForm.internalCostPerDay : equipmentForm.rentalCostPerDay) * equipmentForm.estimatedDays).toLocaleString()}</span>
            </p>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={addEquipment} disabled={equipmentSource === "fleet" ? !selectedEquipmentFleetId || !equipmentForm.estimatedDays : !equipmentForm.name || !equipmentForm.category}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#E8973A" }}>
              <Plus className="w-4 h-4" /> Add Equipment
            </button>
          </div>
        </div>

        {/* Registered Equipment List */}
        {projectEquipment.length > 0 && (
          <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#1A202C" }}>Registered Equipment ({projectEquipment.length})</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "#E2E8F0" }}>
              {projectEquipment.map(e => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#F59E0B" }}>{e.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{e.name}</p>
                      <p className="text-xs text-gray-500">{e.category} · {e.ownership === "company-owned" ? "Company-owned" : e.ownership === "rented" ? "Rented" : "Client-supplied"}{e.estimatedDays ? ` · ${e.estimatedDays} days` : ""}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.totalEstimatedCost ? `Est. Total: ₦${e.totalEstimatedCost.toLocaleString()}` : ""} · {e.status}</p>
                    </div>
                  </div>
                  <button onClick={() => removeEquipment(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}
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
        {currentStep === 3 && renderCalendar()}
        {currentStep === 4 && renderScheduleBuilder()}
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
