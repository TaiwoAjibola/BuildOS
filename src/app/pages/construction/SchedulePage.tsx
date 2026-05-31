import { useParams } from "react-router";
import { useState, useMemo } from "react";
import { Calendar, ChevronRight, ChevronDown, Plus, Edit, Filter, List, BarChart3, GitBranch, X, Save, ArrowLeft, ArrowRight } from "lucide-react";
import type { Task } from "./types";
import { getTasksByProject, getProjectById, fmtDate, ragColor, ragLabel, pctCompleteColor, tasks as allTasks } from "./mockData";

type ViewMode = "list" | "gantt";

function calcDuration(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function hasLevel4Descendant(taskId: string, taskList: Task[]): boolean {
  const children = taskList.filter(t => t.parentTaskId === taskId);
  if (children.some(t => t.level === 4)) return true;
  return children.some(t => hasLevel4Descendant(t.id, taskList));
}

const levelIcons: Record<number, React.ReactNode> = {
  1: <Calendar className="w-4 h-4" />,
  2: <ChevronRight className="w-4 h-4" />,
  3: <GitBranch className="w-4 h-4" />,
};

const ragBarColor: Record<string, string> = {
  "on-track": "#27AE60",
  "at-risk": "#F4A623",
  "delayed": "#E74C3C",
};

const levelNames: Record<number, string> = {
  1: "Stage / Phase",
  2: "Summary Task",
  3: "Sub-summary Task",
  4: "Work Package",
};

const dependencyLabels: Record<string, string> = {
  FS: "Finish-to-Start (FS)",
  FF: "Finish-to-Finish (FF)",
  SS: "Start-to-Start (SS)",
  SF: "Start-to-Finish (SF)",
};

export function SchedulePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const project = getProjectById(projectId!);

  const [tasks, setTasks] = useState<Task[]>(() => getTasksByProject(projectId!));
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(tasks.filter(t => t.level <= 1).map(t => t.id)));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterText, setFilterText] = useState("");

  const rootTasks = useMemo(() => tasks.filter(t => t.level === 1).sort((a, b) => a.plannedStart.localeCompare(b.plannedStart)), [tasks]);

  function toggleExpand(taskId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function handleSaveTask(updated: Task) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(null);
  }

  function handleAddTask(newTask: Task) {
    setTasks(prev => [...prev, newTask]);
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(newTask.id);
      if (newTask.parentTaskId) next.add(newTask.parentTaskId);
      return next;
    });
    setShowAddModal(false);
  }

  const sidePanelTask = selectedTask && selectedTask.level === 4 ? selectedTask : null;

  function renderListRows(taskList: Task[], parentId: string | null, depth: number): React.ReactNode[] {
    const children = taskList.filter(t => t.parentTaskId === parentId);
    if (children.length === 0 && depth === 0) {
      return rootTasks.map(t => renderListRows(taskList, t.id, 1)).flat();
    }

    return children.flatMap(task => {
      const isExpanded = expanded.has(task.id);
      const childList = taskList.filter(t => t.parentTaskId === task.id);
      const hasKids = childList.length > 0;
      const paddingLeft = (task.level - 1) * 24;

      const row = (
        <div key={task.id}>
          <div
            className={`flex items-center gap-2 px-4 py-2.5 border-b border-[#E2E8F0] text-sm transition-colors ${
              task.level === 1
                ? "bg-[#1C2333] text-white font-bold"
                : task.level <= 3
                  ? "bg-white font-medium text-gray-900"
                  : "bg-white font-normal text-gray-700 cursor-pointer hover:bg-amber-50"
            }`}
            style={{ paddingLeft: `${paddingLeft + 16}px` }}
            onClick={() => {
              if (task.level === 4) {
                setSelectedTask(task);
              } else if (hasKids) {
                toggleExpand(task.id);
              }
            }}
          >
            {hasKids ? (
              <button
                onClick={e => { e.stopPropagation(); toggleExpand(task.id); }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            {levelIcons[task.level] && (
              <span className={`flex-shrink-0 ${task.level === 1 ? "text-amber-400" : "text-gray-400"}`}>
                {levelIcons[task.level]}
              </span>
            )}

            <span className="flex-1 truncate">{task.name}</span>

            <span className="text-xs text-gray-400 w-28 flex-shrink-0 text-right">
              {fmtDate(task.plannedStart)}
            </span>

            <span className="text-xs text-gray-400 w-28 flex-shrink-0 text-right">
              {fmtDate(task.plannedEnd)}
            </span>

            <div className="w-24 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${pctCompleteColor(task.percentComplete)}`} style={{ width: `${task.percentComplete}%` }} />
                </div>
                <span className={`text-xs font-medium ${task.percentComplete >= 100 ? "text-green-600" : task.percentComplete >= 60 ? "text-amber-600" : "text-orange-600"}`}>
                  {task.percentComplete}%
                </span>
              </div>
            </div>

            {task.level === 4 && task.vendorId ? (
              <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate text-right">
                {task.vendorId}
              </span>
            ) : (
              <span className="w-28 flex-shrink-0" />
            )}

            <div className="w-20 flex-shrink-0 flex justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${ragColor(task.ragStatus)}`} title={ragLabel(task.ragStatus)} />
            </div>

            <span className="text-xs text-gray-400 w-16 flex-shrink-0 text-right">
              {task.plannedDuration}d
            </span>

            {task.level === 4 && (
              <button
                onClick={e => { e.stopPropagation(); setSelectedTask(task); }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasKids && isExpanded && renderListRows(taskList, task.id, depth + 1)}
        </div>
      );
      return row;
    });
  }

  function renderGantt() {
    const projectStart = new Date(project!.plannedStartDate);
    const projectEnd = new Date(project!.plannedEndDate);
    const totalMs = projectEnd.getTime() - projectStart.getTime();
    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    const today = new Date();
    const todayMs = today.getTime() - projectStart.getTime();
    const todayPct = (todayMs / totalMs) * 100;
    const showToday = todayMs >= 0 && todayMs <= totalMs;

    const months: Date[] = [];
    const cursor = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
    while (cursor <= projectEnd) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    function ganttRows(taskList: Task[], parentId: string | null): React.ReactNode[] {
      const children = taskList.filter(t => t.parentTaskId === (parentId === null ? null : parentId));
      if (children.length === 0 && parentId === null) {
        return rootTasks.flatMap(t => ganttRows(taskList, t.id));
      }

      return children.flatMap(task => {
        const hasLevel4 = hasLevel4Descendant(task.id, taskList);
        if (!hasLevel4 && task.level < 4) return [];

        const childRows = taskList.filter(t => t.parentTaskId === task.id).length > 0
          ? ganttRows(taskList, task.id)
          : [];

        if (childRows.length === 0 && task.level < 4) return [];

        const showHeader = task.level < 4;
        const showBar = task.level === 4;
        const paddingLeft = (task.level - 1) * 24 + 16;

        if (showHeader) {
          return [
            <div
              key={task.id}
              className="flex items-center border-b border-[#E2E8F0]"
            >
              <div
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-50 flex-shrink-0 border-r border-[#E2E8F0]`}
                style={{ width: 320, paddingLeft }}
              >
                {levelIcons[task.level] && (
                  <span className="text-gray-400 flex-shrink-0">{levelIcons[task.level]}</span>
                )}
                <span className="truncate">{task.name}</span>
              </div>
              <div className="flex-1 h-8" />
            </div>,
            ...childRows,
          ];
        }

        const taskStart = new Date(task.plannedStart);
        const taskEnd = new Date(task.plannedEnd);
        const offsetMs = taskStart.getTime() - projectStart.getTime();
        const durMs = taskEnd.getTime() - taskStart.getTime();
        const leftPct = (offsetMs / totalMs) * 100;
        const widthPct = (durMs / totalMs) * 100;

        return [
          <div
            key={task.id}
            className="flex items-center border-b border-[#E2E8F0] hover:bg-amber-50 group"
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 flex-shrink-0 border-r border-[#E2E8F0] cursor-pointer"
              style={{ width: 320, paddingLeft }}
              onClick={() => setSelectedTask(task)}
            >
              <span className="truncate flex-1">{task.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{task.plannedDuration}d</span>
            </div>
            <div className="flex-1 h-8 relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full opacity-80"
                style={{
                  left: `${Math.max(0, leftPct)}%`,
                  width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                  backgroundColor: ragBarColor[task.ragStatus] || "#94A3B8",
                }}
                title={`${task.name}: ${fmtDate(task.plannedStart)} - ${fmtDate(task.plannedEnd)}`}
              />
            </div>
          </div>,
          ...childRows,
        ];
      });
    }

    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline header */}
            <div className="flex border-b border-[#E2E8F0] bg-gray-50">
              <div className="flex items-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0 border-r border-[#E2E8F0]" style={{ width: 320 }}>
                Work Breakdown Structure
              </div>
              <div className="flex-1 relative h-8">
                <div className="flex h-full">
                  {months.map((m, i) => {
                    const mStart = Math.max(0, (m.getTime() - projectStart.getTime()) / totalMs * 100);
                    const nextM = new Date(m);
                    nextM.setMonth(m.getMonth() + 1);
                    const mEnd = Math.min(100, (nextM.getTime() - projectStart.getTime()) / totalMs * 100);
                    const mWidth = mEnd - mStart;
                    return (
                      <div
                        key={i}
                        className="text-xs text-gray-400 flex items-center justify-start px-1 border-r border-[#E2E8F0] flex-shrink-0 h-full"
                        style={{ width: `${mWidth}%`, minWidth: 40 }}
                      >
                        {m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                      </div>
                    );
                  })}
                </div>
                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                    style={{ left: `${todayPct}%` }}
                    title={`Today: ${today.toLocaleDateString("en-GB")}`}
                  />
                )}
              </div>
            </div>

            {/* Rows */}
            {ganttRows(tasks, null)}

            {showToday && (
              <div className="relative h-0">
                <div
                  className="absolute top-0 w-px h-full bg-red-400/50 z-10 pointer-events-none"
                  style={{ left: `${todayPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.name} — Project Schedule</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-[#E2E8F0] p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === "list" ? "bg-[#E8973A] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode("gantt")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === "gantt" ? "bg-[#E8973A] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Gantt
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-[#E2E8F0] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8973A] text-white rounded-md text-sm font-medium hover:bg-[#d4852a] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <div className="w-px h-5 bg-[#E2E8F0] mx-1" />
          <button
            title="Indent task"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#E2E8F0] text-gray-500 rounded-md text-sm hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            title="Outdent task"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#E2E8F0] text-gray-500 rounded-md text-sm hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[#E2E8F0] mx-1" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-gray-500 rounded-md text-sm hover:bg-gray-50 hover:text-gray-700">
            Import from Excel
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Filter tasks..."
              className="pl-8 pr-3 py-1.5 border border-[#E2E8F0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A] w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-[#E2E8F0] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="w-4 flex-shrink-0" />
            <span className="w-4 flex-shrink-0" />
            <span className="flex-1">Task Name</span>
            <span className="w-28 flex-shrink-0 text-right">Planned Start</span>
            <span className="w-28 flex-shrink-0 text-right">Planned End</span>
            <span className="w-24 flex-shrink-0 text-right">% Complete</span>
            <span className="w-28 flex-shrink-0 text-right">Vendor</span>
            <span className="w-20 flex-shrink-0 text-center">RAG</span>
            <span className="w-16 flex-shrink-0 text-right">Dur.</span>
            <span className="w-8 flex-shrink-0" />
          </div>
          <div>
            {renderListRows(tasks, null, 0)}
            {tasks.length === 0 && (
              <div className="py-16 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No tasks found</p>
                <button onClick={() => setShowAddModal(true)} className="mt-3 text-[#E8973A] text-sm font-medium hover:text-[#d4852a]">
                  Create your first task →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        renderGantt()
      )}

      {/* Edit Task Side Panel */}
      {sidePanelTask && (
        <EditTaskPanel task={sidePanelTask} allTasks={tasks} onSave={handleSaveTask} onClose={() => setSelectedTask(null)} />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          projectId={projectId!}
          tasks={tasks}
          onSave={handleAddTask}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function EditTaskPanel({ task, allTasks, onSave, onClose }: { task: Task; allTasks: Task[]; onSave: (t: Task) => void; onClose: () => void }) {
  const [edit, setEdit] = useState({ ...task });
  const set = (k: keyof Task, v: unknown) => setEdit(prev => ({ ...prev, [k]: v }));

  const level4Tasks = allTasks.filter(t => t.level === 4 && t.id !== task.id);

  function handleDateChange(field: "plannedStart" | "plannedEnd", value: string) {
    const next = { ...edit, [field]: value };
    if (next.plannedStart && next.plannedEnd) {
      next.plannedDuration = calcDuration(next.plannedStart, next.plannedEnd);
    }
    setEdit(next);
  }

  const predTask = edit.predecessorId ? allTasks.find(t => t.id === edit.predecessorId) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white shadow-2xl w-96 h-full overflow-y-auto border-l border-[#E2E8F0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Edit Work Package</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Task Name</label>
            <input
              value={edit.name}
              onChange={e => set("name", e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Planned Start</label>
              <input
                type="date"
                value={edit.plannedStart}
                onChange={e => handleDateChange("plannedStart", e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Planned End</label>
              <input
                type="date"
                value={edit.plannedEnd}
                onChange={e => handleDateChange("plannedEnd", e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Duration <span className="text-gray-400 font-normal">(auto-calculated)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={edit.plannedDuration}
                onChange={e => set("plannedDuration", Number(e.target.value))}
                className="w-20 border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">% Complete</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={edit.percentComplete}
                onChange={e => set("percentComplete", Number(e.target.value))}
                className="flex-1 accent-[#E8973A]"
              />
              <span className="text-sm font-medium text-gray-700 w-10 text-right">{edit.percentComplete}%</span>
            </div>
            <div className="mt-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${pctCompleteColor(edit.percentComplete)}`} style={{ width: `${edit.percentComplete}%` }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
            <input
              value={edit.vendorId || ""}
              onChange={e => set("vendorId", e.target.value || null)}
              placeholder="Vendor ID"
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RAG Status</label>
            <select
              value={edit.ragStatus}
              onChange={e => set("ragStatus", e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
            </select>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${ragColor(edit.ragStatus)}`} />
              <span className="text-xs text-gray-500">{ragLabel(edit.ragStatus)}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Predecessor Task</label>
            <select
              value={edit.predecessorId || ""}
              onChange={e => set("predecessorId", e.target.value || null)}
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value="">None</option>
              {level4Tasks.map(p => (
                <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
              ))}
            </select>
          </div>
          {edit.predecessorId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dependency Type</label>
                <select
                  value={edit.dependencyType || "FS"}
                  onChange={e => set("dependencyType", e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                >
                  <option value="FS">FS</option>
                  <option value="FF">FF</option>
                  <option value="SS">SS</option>
                  <option value="SF">SF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Lag / Lead (days)</label>
                <input
                  type="number"
                  value={edit.lagDays}
                  onChange={e => set("lagDays", Number(e.target.value))}
                  className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                />
              </div>
            </div>
          )}
          {predTask && (
            <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600 space-y-1">
              <p><span className="font-medium text-gray-700">Predecessor:</span> {predTask.name}</p>
              <p><span className="font-medium text-gray-700">Dates:</span> {fmtDate(predTask.plannedStart)} → {fmtDate(predTask.plannedEnd)}</p>
              <p><span className="font-medium text-gray-700">Link:</span> {edit.dependencyType || "FS"} {edit.lagDays !== 0 ? `${edit.lagDays > 0 ? "+" : ""}${edit.lagDays}d` : ""}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              rows={4}
              value={edit.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Add notes..."
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A] resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#E2E8F0] sticky bottom-0 bg-white flex gap-3">
          <button
            onClick={() => onSave(edit)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#E8973A] text-white py-2 rounded-md text-sm font-medium hover:bg-[#d4852a] transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ projectId, tasks, onSave, onClose }: {
  projectId: string; tasks: Task[]; onSave: (t: Task) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(4);
  const [parentId, setParentId] = useState("");
  const [plannedStart, setPlannedStart] = useState(new Date().toISOString().split("T")[0]);
  const [plannedEnd, setPlannedEnd] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [predecessorId, setPredecessorId] = useState("");
  const [dependencyType, setDependencyType] = useState<"FS" | "FF" | "SS" | "SF" | null>("FS");
  const [lagDays, setLagDays] = useState(0);

  const duration = calcDuration(plannedStart, plannedEnd);

  const levelLabel = levelNames[level];
  const validParents = tasks.filter(t => t.level < level && t.level >= 1);
  const level4Tasks = tasks.filter(t => t.level === 4);

  const maxId = tasks.reduce((max, t) => {
    const num = parseInt(t.id.replace(/^\D+/, ""), 10);
    return num > max ? num : max;
  }, 0);

  const prefixMap: Record<number, string> = { 1: "ST", 2: "SM", 3: "SS", 4: "WP" };

  function handleSave() {
    if (!name.trim()) return;
    const prefix = prefixMap[level];
    const newId = `${prefix}-${String(maxId + 1).padStart(3, "0")}`;

    const newTask: Task = {
      id: newId,
      projectId,
      parentTaskId: parentId || null,
      level,
      name: name.trim(),
      plannedStart,
      plannedEnd,
      actualStart: null,
      actualEnd: null,
      plannedDuration: duration,
      actualDuration: null,
      percentComplete: 0,
      predecessorId: predecessorId || null,
      dependencyType: predecessorId ? dependencyType : null,
      lagDays,
      vendorId: null,
      ragStatus: "on-track",
      ragOverride: false,
      notes: "",
    };
    onSave(newTask);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Install MEP rough-in"
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={level}
              onChange={e => { setLevel(Number(e.target.value) as 1|2|3|4); setParentId(""); }}
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
            >
              <option value={1}>Level 1 — {levelNames[1]}</option>
              <option value={2}>Level 2 — {levelNames[2]}</option>
              <option value={3}>Level 3 — {levelNames[3]}</option>
              <option value={4}>Level 4 — {levelNames[4]}</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">{levelLabel}</p>
          </div>
          {level > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Task</label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              >
                <option value="">Select parent...</option>
                {validParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {"—".repeat(p.level)}{p.level > 1 ? " " : ""}{p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start</label>
              <input
                type="date"
                value={plannedStart}
                onChange={e => {
                  setPlannedStart(e.target.value);
                  if (e.target.value > plannedEnd) setPlannedEnd(e.target.value);
                }}
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned End</label>
              <input
                type="date"
                value={plannedEnd}
                onChange={e => {
                  setPlannedEnd(e.target.value);
                  if (e.target.value < plannedStart) setPlannedStart(e.target.value);
                }}
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration <span className="text-gray-400 font-normal">(auto-calculated: {duration} days)</span>
            </label>
            <div className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-600">
              {plannedStart} → {plannedEnd} = <strong>{duration} day{duration !== 1 ? "s" : ""}</strong>
            </div>
          </div>
          <div className="border-t border-[#E2E8F0] pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dependencies</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Predecessor Task</label>
                <select
                  value={predecessorId}
                  onChange={e => {
                    setPredecessorId(e.target.value);
                    if (!e.target.value) setDependencyType(null);
                    else if (!dependencyType) setDependencyType("FS");
                  }}
                  className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                >
                  <option value="">None</option>
                  {level4Tasks.map(p => (
                    <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                  ))}
                </select>
              </div>
              {predecessorId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dependency Type</label>
                    <select
                      value={dependencyType || "FS"}
                      onChange={e => setDependencyType(e.target.value as "FS" | "FF" | "SS" | "SF")}
                      className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                    >
                      <option value="FS">Finish-to-Start (FS)</option>
                      <option value="FF">Finish-to-Finish (FF)</option>
                      <option value="SS">Start-to-Start (SS)</option>
                      <option value="SF">Start-to-Finish (SF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lag / Lead (days)</label>
                    <input
                      type="number"
                      value={lagDays}
                      onChange={e => setLagDays(Number(e.target.value))}
                      className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">Positive = lag, negative = lead</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 bg-[#E8973A] text-white py-2 rounded-md text-sm font-medium hover:bg-[#d4852a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Create Task
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
