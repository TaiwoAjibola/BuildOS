import { Outlet } from "react-router";
import { AppHeader } from "../../components/AppHeader";
import { CollapsibleSidebar } from "../../components/CollapsibleSidebar";
import {
  FolderKanban, CheckSquare, BarChart3, LayoutDashboard,
  Calendar, FileText, Users, HardHat, ListTodo, Clock, User, Settings,
} from "lucide-react";

const sidebarSections = [
  {
    label: "",
    items: [
      { label: "Dashboard", href: "/apps/construction/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Tasks",
    items: [
      { label: "Tasks",    href: "/apps/construction/tasks",    icon: <ListTodo className="w-4 h-4" />, end: true },
      { label: "My Tasks", href: "/apps/construction/my-tasks", icon: <User     className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "All Projects",       href: "/apps/construction",           icon: <FolderKanban className="w-4 h-4" />, end: true },
      { label: "Active Projects",    href: "/apps/construction/active",    icon: <HardHat      className="w-4 h-4" />, end: true },
      { label: "Completed Projects", href: "/apps/construction/completed", icon: <CheckSquare  className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Planning",
    items: [
      { label: "Resource Planning", href: "/apps/construction/resource-planning", icon: <Users    className="w-4 h-4" />, end: true },
      { label: "Timeline Planning", href: "/apps/construction/timeline-planning", icon: <Calendar className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Time Tracking", href: "/apps/construction/time-tracking", icon: <Clock       className="w-4 h-4" />, end: true },
      { label: "Approvals",     href: "/apps/construction/approvals",     icon: <CheckSquare className="w-4 h-4" />, end: true },
      { label: "Documents",     href: "/apps/construction/documents",     icon: <FileText    className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Reports", href: "/apps/construction/reports", icon: <BarChart3 className="w-4 h-4" />, end: true },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Project Configuration", href: "/apps/construction/project-config", icon: <Settings className="w-4 h-4" />, end: true },
    ],
  },
];

export function ConstructionLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <AppHeader currentApp="construction" appColor="bg-orange-600" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <CollapsibleSidebar
            sections={sidebarSections}
            activeClass="bg-orange-50 text-orange-700 font-medium [&_svg]:text-orange-600"
            baseClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900 [&_svg]:text-gray-400"
          />
        </aside>
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
