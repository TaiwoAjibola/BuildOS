import { Outlet } from "react-router";
import { HRConfigProvider } from "../stores/hrConfigStore";
import { ResourceProvider } from "../contexts/ResourceContext";

export function AppLayout() {
  return (
    <HRConfigProvider>
      <ResourceProvider>
        <div className="min-h-screen bg-gray-50">
          <Outlet />
        </div>
      </ResourceProvider>
    </HRConfigProvider>
  );
}
