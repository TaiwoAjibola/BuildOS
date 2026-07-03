import { Outlet } from "react-router";
import { HRConfigProvider } from "../stores/hrConfigStore";
import { ResourceProvider } from "../contexts/ResourceContext";
import { TaskProvider } from "../contexts/TaskContext";
import { RolesProvider } from "../contexts/RolesContext";
import { ChangelogProvider } from "../stores/changelogStore";

export function AppLayout() {
  return (
    <ChangelogProvider>
      <HRConfigProvider>
        <ResourceProvider>
          <TaskProvider>
            <RolesProvider>
              <div className="min-h-screen bg-gray-50">
                <Outlet />
              </div>
            </RolesProvider>
          </TaskProvider>
        </ResourceProvider>
      </HRConfigProvider>
    </ChangelogProvider>
  );
}
