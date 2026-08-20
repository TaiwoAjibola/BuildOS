import { Fragment, useMemo, useState } from "react";
import { Plus, Search, Download, Filter, AlertTriangle, Pencil, Trash2, ShoppingCart, CheckCircle, X, RefreshCw, ArrowRightLeft, Package, ChevronRight, Layers } from "lucide-react";
import { useStorefront, type CategoryMaterial, type MaterialType as StoreType } from "../../stores/storefrontStore";

type MaterialStatus = "In Stock" | "Low Stock" | "Out of Stock";
type MaterialType = "Consumable" | "Reusable";
type AllocationStatus = "Available" | "Allocated" | "Under Maintenance";

interface MaterialStock {
  name: string;
  sku?: string;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  unitCost: number;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  materialType: MaterialType;
  types: MaterialStock[];
  allocationStatus?: AllocationStatus;
  allocatedTo?: string;
  allocatedProject?: string;
  condition?: string;
}

const MOCK: Material[] = [
  { id: "MAT-001", name: "Cement (50kg bag)",        category: "Concrete & Cement",     unit: "Bags",    reorderLevel: 100, materialType: "Consumable", types: [
    { name: "Ordinary Portland Cement", sku: "CEM-OPC-50", totalQty: 220, availableQty: 140, reservedQty: 80,  unitCost: 8500 },
    { name: "Rapid-Hardening Cement",   sku: "CEM-RHC-50", totalQty: 160, availableQty: 120, reservedQty: 40,  unitCost: 8600 },
  ] },
  { id: "MAT-002", name: "Steel Rebar",              category: "Steel & Reinforcement", unit: "Tonnes",  reorderLevel: 5,   materialType: "Consumable", types: [
    { name: "Y16", sku: "STL-REB-Y16", totalQty: 12, availableQty: 10, reservedQty: 2, unitCost: 410000 },
    { name: "Y12", sku: "STL-REB-Y12", totalQty: 8,  availableQty: 8,  reservedQty: 0, unitCost: 390000 },
  ] },
  { id: "MAT-003", name: "Cable",                    category: "Electrical",            unit: "Metres",  reorderLevel: 300, materialType: "Consumable", types: [
    { name: "2.5mm Twin", sku: "ELE-CAB-2.5", totalQty: 80, availableQty: 80, reservedQty: 0, unitCost: 850  },
  ] },
  { id: "MAT-004", name: "PVC Pipe",                 category: "Plumbing & Drainage",   unit: "Lengths", reorderLevel: 50,  materialType: "Consumable", types: [
    { name: "2 Inch", sku: "PLB-PVC-2", totalQty: 12, availableQty: 12, reservedQty: 0, unitCost: 4500 },
  ] },
  { id: "MAT-005", name: "Concrete Block",           category: "Concrete & Cement",     unit: "Units",   reorderLevel: 1000,materialType: "Consumable", types: [
    { name: "Solid Block", sku: "BLK-SLD-9", totalQty: 4200, availableQty: 3500, reservedQty: 700, unitCost: 350 },
  ] },
  { id: "MAT-006", name: "Sharp Sand",               category: "Aggregates & Fill",     unit: "Tonnes",  reorderLevel: 30,  materialType: "Consumable", types: [
    { name: "River Sand", sku: "AGG-SND-RIV", totalQty: 95, availableQty: 85, reservedQty: 10, unitCost: 18000 },
  ] },
  { id: "MAT-007", name: "Plywood",                  category: "Timber & Formwork",     unit: "Sheets",  reorderLevel: 15,  materialType: "Reusable",  types: [
    { name: "12mm Sheet", sku: "TMB-PLY-12", totalQty: 18, availableQty: 15, reservedQty: 3, unitCost: 14000 },
    { name: "18mm Sheet", sku: "TMB-PLY-18", totalQty: 12, availableQty: 10, reservedQty: 2, unitCost: 18000 },
  ], allocationStatus: "Available", condition: "Good" },
  { id: "MAT-008", name: "Granite Tiles",            category: "Finishing Materials",   unit: "Boxes",   reorderLevel: 20,  materialType: "Consumable", types: [
    { name: "Wall Tile", sku: "GT-W-600600-MAT", totalQty: 0, availableQty: 0, reservedQty: 0, unitCost: 26000 },
    { name: "Floor Tile", sku: "GT-F-600600-GLO", totalQty: 0, availableQty: 0, reservedQty: 0, unitCost: 28000 },
  ] },
  { id: "MAT-009", name: "Flush Doors",              category: "Finishing Materials",   unit: "Units",   reorderLevel: 10,  materialType: "Consumable", types: [
    { name: "Flush Doors", totalQty: 20, availableQty: 14, reservedQty: 6, unitCost: 45000 },
  ] },
  { id: "MAT-010", name: "Binding Wire",             category: "Steel & Reinforcement", unit: "Rolls",   reorderLevel: 20,  materialType: "Consumable", types: [
    { name: "Binding Wire", totalQty: 28, availableQty: 20, reservedQty: 8, unitCost: 2800 },
  ] },
  { id: "MAT-011", name: "Electrical Conduit 25mm",  category: "Electrical",            unit: "Metres",  reorderLevel: 200, materialType: "Consumable", types: [
    { name: "Electrical Conduit 25mm", totalQty: 45, availableQty: 45, reservedQty: 0, unitCost: 1200 },
  ] },
  { id: "MAT-012", name: "Concrete Mixer (350L)",    category: "Plant & Equipment",     unit: "Units",   reorderLevel: 1,   materialType: "Reusable",  types: [
    { name: "Concrete Mixer (350L)", totalQty: 4, availableQty: 1, reservedQty: 0, unitCost: 450000 },
  ], allocationStatus: "Allocated", allocatedTo: "Block A Site Team", allocatedProject: "Industrial Warehouse", condition: "Good" },
  { id: "MAT-013", name: "Water Pump (3 inch)",      category: "Plant & Equipment",     unit: "Units",   reorderLevel: 1,   materialType: "Reusable",  types: [
    { name: "Water Pump (3 inch)", totalQty: 6, availableQty: 3, reservedQty: 0, unitCost: 180000 },
  ], allocationStatus: "Available", condition: "Good" },
  { id: "MAT-014", name: "Plate Compactor",          category: "Plant & Equipment",     unit: "Units",   reorderLevel: 1,   materialType: "Reusable",  types: [
    { name: "Plate Compactor", totalQty: 2, availableQty: 0, reservedQty: 0, unitCost: 320000 },
  ], allocationStatus: "Under Maintenance", condition: "Needs Servicing" },
  { id: "MAT-015", name: "Safety Harness Set",       category: "Plant & Equipment",     unit: "Sets",    reorderLevel: 5,   materialType: "Reusable",  types: [
    { name: "Safety Harness Set", totalQty: 20, availableQty: 12, reservedQty: 8, unitCost: 65000 },
  ], allocationStatus: "Available", condition: "Good" },
  { id: "MAT-016", name: "Scaffolding Frame (H1.8m)", category: "Plant & Equipment",   unit: "Frames",  reorderLevel: 20,  materialType: "Reusable",  types: [
    { name: "Scaffolding Frame (H1.8m)", totalQty: 80, availableQty: 60, reservedQty: 20, unitCost: 35000 },
  ], allocationStatus: "Allocated", allocatedTo: "Scaffolding Crew", allocatedProject: "Downtown Office Complex", condition: "Good" },
];

const PROJECTS = ["Industrial Warehouse", "Downtown Office Complex", "Riverside Residential", "Highway Interchange", "University Science Block"];

const BLANK: Omit<Material, "id"> = {
  name: "", category: "", unit: "Units", reorderLevel: 0,
  materialType: "Consumable", types: [],
};

function stockTotals(m: Material) {
  return {
    total: m.types.reduce((s, t) => s + t.totalQty, 0),
    available: m.types.reduce((s, t) => s + t.availableQty, 0),
    reserved: m.types.reduce((s, t) => s + t.reservedQty, 0),
  };
}

function avgUnitCost(m: Material): number {
  const { total } = stockTotals(m);
  if (total === 0) return 0;
  return Math.round(m.types.reduce((s, t) => s + t.totalQty * t.unitCost, 0) / total);
}

function getStatus(m: Material): MaterialStatus {
  const { available } = stockTotals(m);
  if (available === 0) return "Out of Stock";
  if (available <= m.reorderLevel) return "Low Stock";
  return "In Stock";
}

const STATUS_STYLE: Record<MaterialStatus, string> = {
  "In Stock":     "bg-green-50 text-green-700",
  "Low Stock":    "bg-yellow-50 text-yellow-700",
  "Out of Stock": "bg-red-50 text-red-700",
};

const ALLOC_STYLE: Record<AllocationStatus, string> = {
  Available:           "bg-green-100 text-green-700",
  Allocated:           "bg-blue-100 text-blue-700",
  "Under Maintenance": "bg-orange-100 text-orange-700",
};

// Resolve the catalogue types (variants) for a material row by name — used to
// decorate each material's stock rows with dimensions from the catalogue.
function resolveTypes(m: Material, catalog: { material: CategoryMaterial }[]): StoreType[] {
  const norm = (s: string) => s.toLowerCase().trim();
  const n = norm(m.name);
  let best: CategoryMaterial | null = null;
  let bestScore = 0;
  for (const { material } of catalog) {
    const mn = norm(material.name);
    if (mn === n) { best = material; bestScore = 100; break; }
    if (n.startsWith(mn) && mn.length > bestScore) { best = material; bestScore = mn.length; }
    if (mn.startsWith(n) && n.length > bestScore) { best = material; bestScore = n.length; }
  }
  return best ? best.types : [];
}

function fmtDim(standard: string, value: string, unit: string): string {
  return standard === "Custom" ? `${standard}: ${value || "—"} ${unit}` : `${value || "—"} ${unit} ${standard}`;
}

// ── Search & select catalogue TYPE (auto-fills category / name / unit) ─────
function CataloguePicker({ onPick, placeholder }: {
  onPick: (type: StoreType, material: CategoryMaterial, categoryName: string) => void;
  placeholder?: string;
}) {
  const { categories } = useStorefront();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const rows: { categoryName: string; material: CategoryMaterial; type: StoreType }[] = [];
    for (const c of categories) {
      for (const m of c.materials) {
        for (const t of m.types) {
          if (!needle
            || t.name.toLowerCase().includes(needle)
            || m.name.toLowerCase().includes(needle)
            || c.name.toLowerCase().includes(needle)) {
            rows.push({ categoryName: c.name, material: m, type: t });
          }
        }
      }
    }
    return rows.slice(0, 30);
  }, [q, categories]);

  function pick(type: StoreType, material: CategoryMaterial, categoryName: string) {
    onPick(type, material, categoryName);
    setQ("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Search material types…"} autoComplete="off"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No matching material types.</p>}
          {results.map(({ categoryName, material, type }, i) => (
            <button key={i} type="button" onMouseDown={() => pick(type, material, categoryName)}
              className="w-full text-left px-4 py-2.5 hover:bg-teal-50 border-b border-gray-50 last:border-0 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{type.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{material.name} · {categoryName}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${material.classification === "Reusable" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                {material.classification}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Allocation Tracking Modal ─────────────────────────────────────────────────
function TrackModal({ material, onClose, onSave }: {
  material: Material;
  onClose: () => void;
  onSave: (updated: Partial<Material>) => void;
}) {
  const [allocationStatus, setAllocationStatus] = useState<AllocationStatus>(material.allocationStatus ?? "Available");
  const [allocatedTo, setAllocatedTo] = useState(material.allocatedTo ?? "");
  const [allocatedProject, setAllocatedProject] = useState(material.allocatedProject ?? "");
  const [condition, setCondition] = useState(material.condition ?? "Good");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Track Reusable Item</h2>
            <p className="text-xs text-gray-500 mt-0.5">{material.name} — {material.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allocation Status</label>
            <div className="flex gap-2">
              {(["Available", "Allocated", "Under Maintenance"] as AllocationStatus[]).map(s => (
                <button key={s} onClick={() => setAllocationStatus(s)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border-2 transition-all ${allocationStatus === s ? `${ALLOC_STYLE[s]} border-current` : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {allocationStatus === "Allocated" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Allocated To (Person / Team)</label>
                <input value={allocatedTo} onChange={e => setAllocatedTo(e.target.value)} placeholder="e.g. Block A Site Team"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Linked Project</label>
                <select value={allocatedProject} onChange={e => setAllocatedProject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="">— None —</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option>Good</option>
              <option>Fair</option>
              <option>Needs Servicing</option>
              <option>Damaged</option>
            </select>
          </div>
          {allocationStatus === "Available" && material.allocationStatus === "Allocated" && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">This item will be marked as <strong>returned to store</strong> and available for re-allocation.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => {
            onSave({
              allocationStatus,
              allocatedTo: allocationStatus === "Allocated" ? allocatedTo : undefined,
              allocatedProject: allocationStatus === "Allocated" ? allocatedProject : undefined,
              condition,
            });
            onClose();
          }} className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-xl">
            {allocationStatus === "Available" && material.allocationStatus === "Allocated" ? "Confirm Return" : "Save Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AllMaterialsPage() {
  const { categories, allCategoryMaterials } = useStorefront();
  const [materials, setMaterials] = useState<Material[]>(MOCK);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<MaterialType | "All">("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Material | null>(null);
  const [form, setForm] = useState<Omit<Material, "id">>({ ...BLANK });
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [procurementTarget, setProcurementTarget] = useState<Material | null>(null);
  const [procurementQty, setProcurementQty] = useState("");
  const [sentToProcurement, setSentToProcurement] = useState<Set<string>>(new Set());
  const [trackTarget, setTrackTarget] = useState<Material | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const CATEGORY_OPTIONS = useMemo(() => {
    const names = new Set<string>();
    categories.forEach(c => c.materials.forEach(() => names.add(c.name)));
    materials.forEach(m => names.add(m.category));
    return ["All", ...Array.from(names)];
  }, [categories, materials]);

  const filtered = materials.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const matchCat = catFilter === "All" || m.category === catFilter;
    const matchStatus = statusFilter === "All" || getStatus(m) === statusFilter;
    const matchType = typeFilter === "All" || m.materialType === typeFilter;
    return matchSearch && matchCat && matchStatus && matchType;
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ ...BLANK, category: CATEGORY_OPTIONS[1] ?? "" });
    setShowModal(true);
  }
  function openEdit(m: Material) {
    setEditTarget(m);
    setForm({ ...m, types: m.types.map(t => ({ ...t })) });
    setShowModal(true);
  }

  function handlePick(type: StoreType, material: CategoryMaterial, categoryName: string) {
    const firstDim = type.dimensions.find(d => d.unit);
    const unit = firstDim?.unit ?? "Units";
    setForm(prev => ({
      ...prev,
      name: material.name,
      category: categoryName,
      unit,
      types: [{ name: type.name, sku: type.sku, totalQty: 0, availableQty: 0, reservedQty: 0, unitCost: 0 }],
    }));
  }

  function patchType(i: number, patch: Partial<MaterialStock>) {
    setForm(prev => ({ ...prev, types: prev.types.map((t, j) => j === i ? { ...t, ...patch } : t) }));
  }

  function save() {
    const cleanTypes = form.types.map(t => ({ ...t, name: t.name.trim() })).filter(t => t.name !== "");
    if (!form.name.trim() || cleanTypes.length === 0) return;
    const payload = { ...form, name: form.name.trim(), types: cleanTypes };
    if (editTarget) {
      setMaterials(prev => prev.map(m => m.id === editTarget.id ? { ...payload, id: editTarget.id } : m));
    } else {
      const id = `MAT-${String(materials.length + 1).padStart(3, "0")}`;
      setMaterials(prev => [...prev, { ...payload, id }]);
    }
    setShowModal(false); setEditTarget(null);
  }
  function doDelete() {
    if (deleteTarget) setMaterials(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  }
  function exportCSV() {
    const rows = [
      ["Material ID", "Name", "Category", "Type", "Unit", "Total Qty", "Available Qty", "Reserved Qty", "Unit Cost", "Status"],
      ...filtered.map(m => {
        const t = stockTotals(m);
        return [m.id, m.name, m.category, m.materialType, m.unit, t.total, t.available, t.reserved, avgUnitCost(m), getStatus(m)];
      }),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "materials.csv"; a.click();
  }

  const low = materials.filter(m => getStatus(m) !== "In Stock").length;
  const reusable = materials.filter(m => m.materialType === "Reusable");
  const allocated = reusable.filter(m => m.allocationStatus === "Allocated").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Materials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete inventory catalogue across all stores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2 rounded-xl hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
          <p className="text-xs text-gray-500">Total Materials</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-600">{low}</p>
          <p className="text-xs text-gray-500">Low / Out of Stock</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{reusable.length}</p>
          <p className="text-xs text-gray-500">Reusable Items</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-600">{allocated}</p>
          <p className="text-xs text-gray-500">Currently Allocated</p>
        </div>
      </div>

      {low > 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{low} material{low > 1 ? "s" : ""}</span> below reorder level or out of stock — consider raising a procurement request.
          </p>
        </div>
      )}

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Type:</span>
        {(["All", "Consumable", "Reusable"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium flex items-center gap-1.5 ${typeFilter === t ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {t === "Reusable" && <RefreshCw className="w-3 h-3" />}
            {t === "Consumable" && <Package className="w-3 h-3" />}
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Search material ID, name, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {CATEGORY_OPTIONS.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium ${catFilter === c ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(["All", "In Stock", "Low Stock", "Out of Stock"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium ${statusFilter === s ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Material ID</th>
              <th className="px-4 py-3 text-left font-medium">Material Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Total Qty</th>
              <th className="px-4 py-3 text-right font-medium">Available</th>
              <th className="px-4 py-3 text-right font-medium">Reserved</th>
              <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
              <th className="px-4 py-3 text-left font-medium">Stock Status</th>
              <th className="px-4 py-3 text-left font-medium">Allocation</th>
              <th className="px-4 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400 text-sm">No materials found.</td></tr>
            )}
            {filtered.map((m) => {
              const status = getStatus(m);
              const catByName = new Map(resolveTypes(m, allCategoryMaterials).map(t => [t.name, t]));
              const totals = stockTotals(m);
              const unitCost = avgUnitCost(m);
              const isOpen = expanded === m.id;
              return (
                <Fragment key={m.id}>
                  <tr className={`transition-colors group ${isOpen ? "bg-teal-50/40" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <button onClick={() => setExpanded(isOpen ? null : m.id)}
                        className="inline-flex items-center gap-1.5 text-left group/title">
                        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        <span className="hover:text-teal-700">{m.name}</span>
                        {m.types.length > 0 && <span className="text-[10px] text-gray-400 font-normal">{m.types.length} type{m.types.length === 1 ? "" : "s"} · tap</span>}
                      </button>
                      {m.allocatedTo && <p className="text-xs text-blue-500 mt-0.5">→ {m.allocatedTo}{m.allocatedProject ? ` · ${m.allocatedProject}` : ""}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${m.materialType === "Reusable" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.materialType === "Reusable" ? <RefreshCw className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                        {m.materialType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.category}</td>
                    <td className="px-4 py-3 text-gray-600">{m.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{totals.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{totals.available.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{totals.reserved.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₦{unitCost.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[status]}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {m.materialType === "Reusable" && m.allocationStatus ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ALLOC_STYLE[m.allocationStatus]}`}>{m.allocationStatus}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.materialType === "Reusable" && (
                          <button onClick={() => setTrackTarget(m)}
                            className="p-1 text-indigo-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Track / Return">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(status === "Low Stock" || status === "Out of Stock") && (
                          <button onClick={() => { setProcurementTarget(m); setProcurementQty(""); }}
                            className={`p-1 rounded ${sentToProcurement.has(m.id) ? "text-green-500" : "text-amber-500 hover:text-amber-700 hover:bg-amber-50"}`}
                            title={sentToProcurement.has(m.id) ? "Sent to Procurement" : "Send for Procurement"}>
                            {sentToProcurement.has(m.id) ? <CheckCircle className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button onClick={() => openEdit(m)} className="p-1 text-gray-400 hover:text-teal-600 rounded hover:bg-teal-50" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(m)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-gray-50/60">
                      <td colSpan={12} className="px-6 py-4">
                        {m.types.length === 0 ? (
                          <p className="text-sm text-gray-400">No stock types defined for this material — edit the material to add types.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-teal-500" /> Types under {m.name}
                            </p>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium">Type</th>
                                    <th className="px-4 py-2 text-right font-medium">Total Qty</th>
                                    <th className="px-4 py-2 text-right font-medium">Available</th>
                                    <th className="px-4 py-2 text-right font-medium">Reserved</th>
                                    <th className="px-4 py-2 text-right font-medium">Unit Cost</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {m.types.map((t, ti) => {
                                    const cat = catByName.get(t.name);
                                    return (
                                      <tr key={ti} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                          <span className="font-semibold text-gray-800">{t.name}</span>
                                          {cat && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {cat.dimensions.map((d, di) => (
                                                <span key={di} className="text-[10px] text-gray-500">{fmtDim(d.standard, d.value, d.unit)}</span>
                                              ))}
                                              {cat.sku && <span className="font-mono text-[9px] text-gray-400">{cat.sku}</span>}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900">{t.totalQty.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900">{t.availableQty.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right text-gray-500">{t.reservedQty.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right text-gray-600">₦{t.unitCost.toLocaleString()}</td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="bg-gray-50/80 border-t border-gray-100">
                                    <td className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Accumulated totals</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{totals.total.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{totals.available.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{totals.reserved.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">₦{unitCost.toLocaleString()}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">Showing {filtered.length} of {materials.length} materials</p>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editTarget ? `Edit Material (${editTarget.id})` : "Add Material"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editTarget ? "Update stock types and quantities." : "Pick a type from the catalogue or define it manually."}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!editTarget && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Add from Catalogue</label>
                  <CataloguePicker onPick={handlePick} placeholder="Search by material type (e.g. Ordinary Portland Cement)…" />
                  <p className="text-[10px] text-gray-400 mt-1">Search matches <strong>material types</strong>; name, category and unit auto-fill from the chosen type.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Material Name</label>
                  <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Cement (50kg bag)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">— Select category —</option>
                    {CATEGORY_OPTIONS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Material Type</label>
                  <select value={form.materialType} onChange={(e) => setForm(p => ({ ...p, materialType: e.target.value as MaterialType }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option>Consumable</option>
                    <option>Reusable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
                  <input type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm(p => ({ ...p, reorderLevel: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Stock Types</label>
                  <button onClick={() => setForm(p => ({ ...p, types: [...p.types, { name: "", totalQty: 0, availableQty: 0, reservedQty: 0, unitCost: 0 }] }))}
                    className="text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Type
                  </button>
                </div>
                {form.types.length === 0 && (
                  <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center">
                    No types yet — pick one above or add a type manually.
                  </p>
                )}
                <div className="space-y-2">
                  {form.types.map((t, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={t.name} onChange={(e) => patchType(i, { name: e.target.value })}
                          placeholder={`Type name (e.g. ${i === 0 ? "Ordinary Portland Cement" : "Rapid-Hardening Cement"})`}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                        <input value={t.sku ?? ""} onChange={(e) => patchType(i, { sku: e.target.value })}
                          placeholder="SKU" className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-teal-500" />
                        <button onClick={() => setForm(p => ({ ...p, types: p.types.filter((_, j) => j !== i) }))}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded" title="Remove type"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {([["totalQty", "Total Qty"], ["availableQty", "Available"], ["reservedQty", "Reserved"], ["unitCost", "Unit Cost ₦"]] as [keyof MaterialStock, string][]).map(([key, label]) => (
                          <div key={String(key)}>
                            <label className="block text-[10px] text-gray-400 font-medium mb-0.5">{label}</label>
                            <input type="number" min={0} value={t[key]} onChange={(e) => patchType(i, { [key]: Number(e.target.value) } as Partial<MaterialStock>)}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={!form.name.trim() || form.types.length === 0}
                className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
                {editTarget ? "Save Changes" : "Add Material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Delete material</h2>
                  <p className="text-xs text-gray-500">{deleteTarget.name} — {deleteTarget.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">This removes the material and its {deleteTarget.types.length} stock type{deleteTarget.types.length === 1 ? "" : "s"} from the inventory. This cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={doDelete} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Procurement request */}
      {procurementTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Send for Procurement</h2>
                <p className="text-xs text-gray-500 mt-0.5">{procurementTarget.name} — {getStatus(procurementTarget)}</p>
              </div>
              <button onClick={() => setProcurementTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">Available</p>
                  <p className="text-lg font-semibold text-gray-900">{stockTotals(procurementTarget).available.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">Reorder Level</p>
                  <p className="text-lg font-semibold text-gray-900">{procurementTarget.reorderLevel.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity to Request</label>
                <input type="number" min={1} value={procurementQty} onChange={(e) => setProcurementQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. 50" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setProcurementTarget(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                if (!procurementQty || Number(procurementQty) <= 0) return;
                setSentToProcurement(p => new Set(p).add(procurementTarget.id));
                setProcurementTarget(null);
              }} disabled={!procurementQty || Number(procurementQty) <= 0}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <ShoppingCart className="w-4 h-4" /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {trackTarget && (
        <TrackModal material={trackTarget} onClose={() => setTrackTarget(null)}
          onSave={(updated) => setMaterials(prev => prev.map(m => m.id === trackTarget.id ? { ...m, ...updated } : m))} />
      )}
    </div>
  );
}
