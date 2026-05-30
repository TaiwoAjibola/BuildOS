import { Outlet, useParams, useLocation, NavLink } from "react-router";
import { AppHeader } from "../../components/AppHeader";
import { CollapsibleSidebar } from "../../components/CollapsibleSidebar";
import type { SidebarSection } from "../../components/CollapsibleSidebar";
import { getProjectById } from "./mockData";
import {
  LayoutDashboard, FolderKanban, Users, ShoppingCart, BarChart3, Settings,
  ClipboardList, Calendar, FileText, Truck, AlertTriangle, GitCompare,
  Clock, CheckSquare, ShieldCheck, FileSpreadsheet, Briefcase,
} from "lucide-react";

function ProjectSidebarSection({ projectId }: { projectId: string }) {
  const project = getProjectById(projectId);
  if (!project) return null;
  const location = useLocation();

  const subTabs = [
    { label: "Overview", href: `/apps/construction/projects/${projectId}/overview`, icon: <ClipboardList className="w-4 h-4" /> },
    { label: "Schedule", href: `/apps/construction/projects/${projectId}/schedule`, icon: <Calendar className="w-4 h-4" /> },
    { label: "Daily Reports", href: `/apps/construction/projects/${projectId}/daily-reports`, icon: <FileText className="w-4 h-4" /> },
    { label: "Vendors", href: `/apps/construction/projects/${projectId}/vendors`, icon: <Truck className="w-4 h-4" /> },
    { label: "Issues", href: `/apps/construction/projects/${projectId}/issues`, icon: <AlertTriangle className="w-4 h-4" /> },
    { label: "Change Requests", href: `/apps/construction/projects/${projectId}/change-requests`, icon: <GitCompare className="w-4 h-4" /> },
    { label: "Delays", href: `/apps/construction/projects/${projectId}/delays`, icon: <Clock className="w-4 h-4" /> },
    { label: "Quality", href: `/apps/construction/projects/${projectId}/quality`, icon: <CheckSquare className="w-4 h-4" /> },
    { label: "HSE", href: `/apps/construction/projects/${projectId}/hse`, icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Documents", href: `/apps/construction/projects/${projectId}/documents`, icon: <FolderKanban className="w-4 h-4" /> },
    { label: "Costs", href: `/apps/construction/projects/${projectId}/costs`, icon: <FileSpreadsheet className="w-4 h-4" /> },
    { label: "Stakeholders", href: `/apps/construction/projects/${projectId}/stakeholders`, icon: <Briefcase className="w-4 h-4" /> },
  ];

  return (
    <div className="mb-1">
      <div className="px-2 py-1.5">
        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest">{project.name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{project.client}</p>
      </div>
      <div className="space-y-0.5">
        {subTabs.map(tab => (
          <NavLink
            key={tab.href}
            to={tab.href}
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-amber-500/10 text-amber-400 font-medium [&_svg]:text-amber-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 [&_svg]:text-slate-500"
              }`
            }
          >
            {tab.icon}
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function ConstructionLayout() {
  const { id } = useParams();
  const location = useLocation();

  const baseSections: SidebarSection[] = [
    {
      label: "",
      items: [
        { label: "Dashboard", href: "/apps/construction/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, end: true },
      ],
    },
    {
      label: "Projects",
      items: [
        { label: "All Projects", href: "/apps/construction", icon: <FolderKanban className="w-4 h-4" />, end: true },
      ],
    },
    {
      label: "Resources",
      items: [
        { label: "Resources", href: "/apps/construction/resources", icon: <Users className="w-4 h-4" />, end: true },
      ],
    },
    {
      label: "Links",
      items: [
        { label: "Procurement", href: "/apps/procurement", icon: <ShoppingCart className="w-4 h-4" />, end: true },
      ],
    },
    {
      label: "Reports",
      items: [
        { label: "Reports", href: "/apps/construction/reports", icon: <BarChart3 className="w-4 h-4" />, end: true },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Settings", href: "/apps/construction/settings", icon: <Settings className="w-4 h-4" />, end: true },
      ],
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#F7F8FA" }}>
      <AppHeader currentApp="construction" appColor="bg-amber-600" />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="w-56 flex-shrink-0 overflow-y-auto flex flex-col"
          style={{ backgroundColor: "#1C2333" }}
        >
          <CollapsibleSidebar
            sections={baseSections}
            activeClass="bg-amber-500/10 text-amber-400 font-medium [&_svg]:text-amber-400"
            baseClass="text-slate-400 hover:bg-slate-800 hover:text-slate-200 [&_svg]:text-slate-500"
          />
          {id && <ProjectSidebarSection projectId={id} />}
        </aside>
        <main className="flex-1 overflow-y-auto min-w-0" style={{ backgroundColor: "#F7F8FA" }}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
