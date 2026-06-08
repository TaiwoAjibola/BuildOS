import { useParams } from "react-router";
import { useMemo } from "react";
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { getProjectById, tasks as allTasks, fmtDate } from "./mockData";

export function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id || "");

  const projectTasks = useMemo(() => allTasks.filter(t => t.projectId === id), [id]);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const overdue = projectTasks.filter(t => t.percentComplete < 100 && t.plannedEnd < todayStr);
  const inProgress = projectTasks.filter(t => t.percentComplete > 0 && t.percentComplete < 100);
  const completed = projectTasks.filter(t => t.percentComplete === 100);
  const notStarted = projectTasks.filter(t => t.percentComplete === 0 && t.plannedStart >= todayStr);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 text-sm">Project not found.</p>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: typeof projectTasks[0] }) => (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${task.ragStatus === "on-track" ? "bg-green-500" : task.ragStatus === "at-risk" ? "bg-yellow-500" : "bg-red-500"}`} />
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-xs truncate">{task.wbsNumber ? `${task.wbsNumber} — ` : ""}{task.name}</p>
          <p className="text-[10px] text-gray-500">
            {fmtDate(task.plannedStart)} — {fmtDate(task.plannedEnd)} · {task.percentComplete}% · Lvl {task.level}
            {task.vendorId ? ` · Vendor assigned` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div className="h-1.5 rounded-full" style={{ width: `${task.percentComplete}%`, backgroundColor: task.percentComplete === 100 ? "#10B981" : "#E8973A" }} />
        </div>
        <span className="text-[10px] font-medium text-gray-500 w-8 text-right">{task.percentComplete}%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overdue.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inProgress.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Not Started</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{notStarted.length}</p>
        </div>
      </div>

      {/* Overdue tasks */}
      <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Overdue Tasks ({overdue.length})
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {overdue.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No overdue tasks. Great job!</p>
          ) : (
            overdue.map(t => <TaskCard key={t.id} task={t} />)
          )}
        </div>
      </div>

      {/* All tasks */}
      <div className="rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#1A202C" }}>All Project Tasks ({projectTasks.length})</h3>
        </div>
        <div className="p-4 space-y-2">
          {projectTasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No tasks yet. Go to Setup → Schedule Builder to create tasks.</p>
          ) : (
            projectTasks.map(t => <TaskCard key={t.id} task={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
