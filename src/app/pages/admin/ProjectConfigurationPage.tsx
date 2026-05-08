import { useState } from "react";
import {
  FolderCog,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ApprovalType = "single" | "group" | "tier";

interface TierLevel {
  level: number;
  approver: string;
  condition: string;
}

interface ProcessWorkflow {
  id: string;
  process: string;
  app: string;
  workflowType: ApprovalType;
  approver?: string; // for single
  groupApprovers?: string[]; // for group
  tierLevels?: TierLevel[]; // for tier
}

// ── Static approval workflow types ────────────────────────────────────────────
const APPROVAL_WORKFLOW_TYPES = [
  {
    key: "single" as ApprovalType,
    code: "WT-01",
    name: "Single Approval",
    description:
      "One designated person must approve the request. Simplest and fastest.",
    icon: User,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    example: "e.g. Line manager approves leave request",
  },
  {
    key: "group" as ApprovalType,
    code: "WT-02",
    name: "Group Approval",
    description:
      "A defined group or team must approve. Any member OR all members may be required.",
    icon: Users,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    example: "e.g. Any director from the Finance Committee approves expense",
  },
  {
    key: "tier" as ApprovalType,
    code: "WT-03",
    name: "Tier Approval",
    description:
      "Multi-level sequential approval. Each level must approve before advancing to the next.",
    icon: Layers,
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    example: "e.g. Supervisor → Finance Manager → CFO for budget over ₦10M",
  },
];

// ── Available processes ────────────────────────────────────────────────────────
const AVAILABLE_PROCESSES: { id: string; label: string; app: string }[] = [];

// ── Available approvers ────────────────────────────────────────────────────────
const AVAILABLE_USERS: string[] = [];

// ── Extended process catalog ─────────────────────────────────────────────────
const PROCESS_CATALOG: {
  id: string;
  label: string;
  app: string;
  description: string;
  requiresApproval: boolean;
}[] = [];

const CATALOG_APP_COLORS: Record<string, string> = {
  Procurement: "bg-blue-50 text-blue-700 border-blue-100",
  Finance: "bg-emerald-50 text-emerald-700 border-emerald-100",
  HR: "bg-purple-50 text-purple-700 border-purple-100",
  ESS: "bg-teal-50 text-teal-700 border-teal-100",
  Construction: "bg-amber-50 text-amber-700 border-amber-100",
  Storefront: "bg-orange-50 text-orange-700 border-orange-100",
};

function TypeBadge({ type }: { type: ApprovalType }) {
  const map = {
    single: "bg-blue-100 text-blue-700",
    group: "bg-purple-100 text-purple-700",
    tier: "bg-amber-100 text-amber-700",
  };
  const labels = { single: "Single", group: "Group", tier: "Tier" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[type]}`}>
      {labels[type]}
    </span>
  );
}

// ── Configure Workflow Modal ──────────────────────────────────────────────────
function ConfigureWorkflowModal({
  existing,
  onSave,
  onClose,
}: {
  existing?: ProcessWorkflow;
  onSave: (wf: ProcessWorkflow) => void;
  onClose: () => void;
}) {
  const [selectedProcess, setSelectedProcess] = useState(
    existing?.process ?? "",
  );
  const [selectedApp, setSelectedApp] = useState(existing?.app ?? "");
  const [wfType, setWfType] = useState<ApprovalType>(
    existing?.workflowType ?? "single",
  );
  const [approver, setApprover] = useState(existing?.approver ?? "");
  const [groupApprovers, setGroupApprovers] = useState<string[]>(
    existing?.groupApprovers ?? [],
  );
  const [tierLevels, setTierLevels] = useState<TierLevel[]>(
    existing?.tierLevels ?? [
      { level: 1, approver: "", condition: "All amounts" },
    ],
  );

  const toggleGroup = (user: string) => {
    setGroupApprovers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user],
    );
  };

  const addTierLevel = () => {
    setTierLevels((prev) => [
      ...prev,
      { level: prev.length + 1, approver: "", condition: "" },
    ]);
  };

  const handleSave = () => {
    onSave({
      id: existing?.id ?? `wf_${Date.now()}`,
      process: selectedProcess,
      app: selectedApp,
      workflowType: wfType,
      approver: wfType === "single" ? approver : undefined,
      groupApprovers: wfType === "group" ? groupApprovers : undefined,
      tierLevels: wfType === "tier" ? tierLevels : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {existing ? "Edit" : "Configure"} Process Workflow
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Link a process to an approval workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Select process */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Process
            </label>
            <select
              value={selectedProcess}
              onChange={(e) => {
                const proc = AVAILABLE_PROCESSES.find(
                  (p) => p.label === e.target.value,
                );
                setSelectedProcess(e.target.value);
                setSelectedApp(proc?.app ?? "");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {AVAILABLE_PROCESSES.map((p) => (
                <option key={p.id} value={p.label}>
                  [{p.app}] {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Approval type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Approval Workflow Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {APPROVAL_WORKFLOW_TYPES.map((wt) => (
                <button
                  key={wt.key}
                  onClick={() => setWfType(wt.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors ${
                    wfType === wt.key
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <wt.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{wt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Single approver */}
          {wfType === "single" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Approver
              </label>
              <select
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select approver…</option>
                {AVAILABLE_USERS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Group approvers */}
          {wfType === "group" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Group Approvers{" "}
                <span className="text-gray-400">(select multiple)</span>
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {AVAILABLE_USERS.map((u) => (
                  <label
                    key={u}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={groupApprovers.includes(u)}
                      onChange={() => toggleGroup(u)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{u}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tier levels */}
          {wfType === "tier" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Approval Levels
              </label>
              <div className="space-y-3">
                {tierLevels.map((level, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      {level.level}
                    </div>
                    <div className="flex-1 space-y-2">
                      <select
                        value={level.approver}
                        onChange={(e) =>
                          setTierLevels((prev) =>
                            prev.map((l, li) =>
                              li === i ? { ...l, approver: e.target.value } : l,
                            ),
                          )
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">Select approver…</option>
                        {AVAILABLE_USERS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <input
                        value={level.condition}
                        onChange={(e) =>
                          setTierLevels((prev) =>
                            prev.map((l, li) =>
                              li === i
                                ? { ...l, condition: e.target.value }
                                : l,
                            ),
                          )
                        }
                        placeholder="Condition, e.g. Above ₦1,000,000"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    {tierLevels.length > 1 && (
                      <button
                        onClick={() =>
                          setTierLevels((prev) =>
                            prev
                              .filter((_, li) => li !== i)
                              .map((l, li) => ({ ...l, level: li + 1 })),
                          )
                        }
                        className="text-gray-300 hover:text-red-400 mt-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTierLevel}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Level
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            {existing ? "Save Changes" : "Add Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProjectConfigurationPage() {
  const [activeTab, setActiveTab] = useState<"workflows" | "process_list">(
    "workflows",
  );
  const [workflows, setWorkflows] = useState<ProcessWorkflow[]>([]);
  const [showWfModal, setShowWfModal] = useState(false);
  const [editingWf, setEditingWf] = useState<ProcessWorkflow | undefined>(
    undefined,
  );
  const [expandedWfId, setExpandedWfId] = useState<string | null>(null);
  const [catalogAppFilter, setCatalogAppFilter] = useState("All");

  const catalogApps = [
    "All",
    ...Array.from(new Set(PROCESS_CATALOG.map((p) => p.app))),
  ];
  const filteredCatalog =
    catalogAppFilter === "All"
      ? PROCESS_CATALOG
      : PROCESS_CATALOG.filter((p) => p.app === catalogAppFilter);
  const catalogByApp = filteredCatalog.reduce<
    Record<string, typeof PROCESS_CATALOG>
  >((acc, p) => {
    if (!acc[p.app]) acc[p.app] = [];
    acc[p.app].push(p);
    return acc;
  }, {});

  const TABS = [
    { key: "workflows" as const, label: "Process Workflows" },
    { key: "process_list" as const, label: "Process List" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure approval workflows, process types, and status lifecycles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? "border-indigo-500 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROCESS LIST TAB ── */}
      {activeTab === "process_list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {PROCESS_CATALOG.length} system processes across{" "}
              {catalogApps.length - 1} applications
            </p>
            <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {catalogApps.map((app) => (
                <button
                  key={app}
                  onClick={() => setCatalogAppFilter(app)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    catalogAppFilter === app
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(catalogByApp).map(([app, processes]) => (
            <div
              key={app}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50">
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${CATALOG_APP_COLORS[app] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  {app}
                </span>
                <span className="text-xs text-gray-400">
                  {processes.length} processes
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {processes.map((proc) => (
                  <div
                    key={proc.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">
                          {proc.label}
                        </p>
                        <span className="text-xs font-mono text-gray-400">
                          {proc.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {proc.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {proc.requiresApproval ? (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Requires Approval
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> No Approval
                        </span>
                      )}
                      {/* Show linked workflow if any */}
                      {workflows.find((w) => w.process === proc.label) && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Workflow configured
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROCESS WORKFLOWS TAB ── */}
      {activeTab === "workflows" && (
        <div className="space-y-6">
          {/* Approval Workflow Types — static, read-only */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">
                Approval Workflow Types
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-1">
                Read-only
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {APPROVAL_WORKFLOW_TYPES.map((wt) => (
                <div
                  key={wt.key}
                  className={`rounded-xl border p-4 ${wt.color}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${wt.iconBg}`}>
                      <wt.icon className={`w-5 h-5 ${wt.iconColor}`} />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-gray-500">
                        {wt.code}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {wt.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {wt.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    {wt.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Process Workflow Configuration — dynamic */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Process Workflow Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Link each process to an approval workflow type and define
                  approvers
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingWf(undefined);
                  setShowWfModal(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Process Workflow
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No process workflows configured yet.
                </p>
                <button
                  onClick={() => setShowWfModal(true)}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Configure first workflow
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {workflows.map((wf) => {
                  const isExpanded = expandedWfId === wf.id;
                  const wfTypeDef = APPROVAL_WORKFLOW_TYPES.find(
                    (w) => w.key === wf.workflowType,
                  );
                  return (
                    <div key={wf.id}>
                      <div className="flex items-center px-5 py-4 gap-4 hover:bg-gray-50/60 group transition-colors">
                        <button
                          onClick={() =>
                            setExpandedWfId(isExpanded ? null : wf.id)
                          }
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {wf.process}
                            </p>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {wf.app}
                            </span>
                          </div>
                        </div>
                        <TypeBadge type={wf.workflowType} />
                        {wf.workflowType === "single" && wf.approver && (
                          <span className="text-xs text-gray-500 hidden md:block">
                            {wf.approver}
                          </span>
                        )}
                        {wf.workflowType === "group" && (
                          <span className="text-xs text-gray-500 hidden md:block">
                            {wf.groupApprovers?.length ?? 0} approvers
                          </span>
                        )}
                        {wf.workflowType === "tier" && (
                          <span className="text-xs text-gray-500 hidden md:block">
                            {wf.tierLevels?.length ?? 0} levels
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingWf(wf);
                              setShowWfModal(true);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setWorkflows((prev) =>
                                prev.filter((w) => w.id !== wf.id),
                              )
                            }
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-5 pb-4 ml-12 space-y-2">
                          {wf.workflowType === "single" && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <User className="w-4 h-4 text-blue-500 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Single Approver
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {wf.approver || "—"}
                                </p>
                              </div>
                            </div>
                          )}
                          {wf.workflowType === "group" && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="text-xs text-gray-500 mb-2">
                                Group Approvers
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(wf.groupApprovers ?? []).map((u) => (
                                  <span
                                    key={u}
                                    className="px-2 py-0.5 bg-white border border-purple-200 text-purple-700 text-xs rounded-full"
                                  >
                                    {u}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {wf.workflowType === "tier" && (
                            <div className="space-y-2">
                              {(wf.tierLevels ?? []).map((level) => (
                                <div
                                  key={level.level}
                                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                                >
                                  <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {level.level}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {level.approver || "—"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {level.condition}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showWfModal && (
        <ConfigureWorkflowModal
          existing={editingWf}
          onSave={(wf) => {
            setWorkflows((prev) =>
              editingWf
                ? prev.map((w) => (w.id === wf.id ? wf : w))
                : [...prev, wf],
            );
          }}
          onClose={() => {
            setShowWfModal(false);
            setEditingWf(undefined);
          }}
        />
      )}
    </div>
  );
}
