import { ReactNode } from "react";
import { Link, useLocation } from "react-router";

interface SidebarProps {
  items: Array<{
    label: string;
    href: string;
    icon: ReactNode;
  }>;
}

export function Sidebar({ items }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)]">
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href ||
                          (item.href !== '/apps/construction' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className={isActive ? "text-blue-700" : "text-gray-500"}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
