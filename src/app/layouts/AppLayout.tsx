import { Outlet } from "react-router";
import { HRConfigProvider } from "../stores/hrConfigStore";

export function AppLayout() {
  return (
    <HRConfigProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </HRConfigProvider>
  );
}
