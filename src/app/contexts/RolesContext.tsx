import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ProjectRole } from "../pages/construction/types";
import { DEFAULT_PROJECT_ROLES } from "../pages/construction/types";

interface RolesContextType {
  roles: ProjectRole[];
  addRole: (role: Omit<ProjectRole, "id">) => void;
  updateRole: (id: string, updates: Partial<ProjectRole>) => void;
  deleteRole: (id: string) => void;
  getRole: (id: string) => ProjectRole | undefined;
  isDefaultRole: (id: string) => boolean;
}

const RolesContext = createContext<RolesContextType | null>(null);

const DEFAULT_ROLE_IDS = DEFAULT_PROJECT_ROLES.map(r => r.id);

export function RolesProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<ProjectRole[]>(DEFAULT_PROJECT_ROLES);

  const addRole = useCallback((role: Omit<ProjectRole, "id">) => {
    const id = `role-custom-${Date.now()}`;
    setRoles(prev => [...prev, { ...role, id }]);
  }, []);

  const updateRole = useCallback((id: string, updates: Partial<ProjectRole>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  }, []);

  const getRole = useCallback((id: string) => {
    return roles.find(r => r.id === id);
  }, [roles]);

  const isDefaultRole = useCallback((id: string) => {
    return DEFAULT_ROLE_IDS.includes(id);
  }, []);

  return (
    <RolesContext.Provider value={{ roles, addRole, updateRole, deleteRole, getRole, isDefaultRole }}>
      {children}
    </RolesContext.Provider>
  );
}

export function useRoles() {
  const ctx = useContext(RolesContext);
  if (!ctx) throw new Error("useRoles must be used within RolesProvider");
  return ctx;
}

export { RolesContext };
