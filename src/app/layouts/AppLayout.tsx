import { Outlet } from "react-router";
import { HRConfigProvider } from "../stores/hrConfigStore";
import { ResourceProvider } from "../contexts/ResourceContext";
import { TaskProvider } from "../contexts/TaskContext";

export function AppLayout() {
  return (
    <HRConfigProvider>
      <ResourceProvider>
        <TaskProvider>
          <div className="min-h-screen bg-gray-50">
            <Outlet />
          </div>
        </TaskProvider>
      </ResourceProvider>
    </HRConfigProvider>
  );
}
