import { Outlet } from "react-router";
import { HRConfigProvider } from "../stores/hrConfigStore";
import { ResourceProvider } from "../contexts/ResourceContext";
import { TaskProvider } from "../contexts/TaskContext";
import { RolesProvider } from "../contexts/RolesContext";
import { ChangelogProvider } from "../stores/changelogStore";
import { NumberingProvider } from "../stores/numberingStore";
import { ProjectTypeProvider } from "../stores/projectTypeStore";
import { EmployeeProvider } from "../stores/employeeStore";
import { FinanceProvider } from "../stores/financeStore";

export function AppLayout() {
  return (
    <FinanceProvider>
      <ChangelogProvider>
        <HRConfigProvider>
          <ResourceProvider>
            <TaskProvider>
              <RolesProvider>
                <NumberingProvider>
                  <ProjectTypeProvider>
                    <EmployeeProvider>
                      <div className="min-h-screen bg-gray-50">
                        <Outlet />
                      </div>
                    </EmployeeProvider>
                  </ProjectTypeProvider>
                </NumberingProvider>
              </RolesProvider>
            </TaskProvider>
          </ResourceProvider>
        </HRConfigProvider>
      </ChangelogProvider>
    </FinanceProvider>
  );
}
