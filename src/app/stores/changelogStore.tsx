import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  details?: string;
  performedBy: string;
}

interface ChangelogContextValue {
  entries: ChangelogEntry[];
  logChange: (entry: Omit<ChangelogEntry, "id" | "timestamp">) => void;
  getByModule: (module: string) => ChangelogEntry[];
  getByEntity: (entityType: string, entityId: string) => ChangelogEntry[];
  clearAll: () => void;
}

const ChangelogContext = createContext<ChangelogContextValue | null>(null);

export function ChangelogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  const logChange = useCallback((entry: Omit<ChangelogEntry, "id" | "timestamp">) => {
    setEntries(prev => [{
      id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }, ...prev]);
  }, []);

  const getByModule = useCallback((module: string) =>
    entries.filter(e => e.module === module),
  [entries]);

  const getByEntity = useCallback((entityType: string, entityId: string) =>
    entries.filter(e => e.entityType === entityType && e.entityId === entityId),
  [entries]);

  const clearAll = useCallback(() => setEntries([]), []);

  return (
    <ChangelogContext.Provider value={{ entries, logChange, getByModule, getByEntity, clearAll }}>
      {children}
    </ChangelogContext.Provider>
  );
}

export function useChangelog() {
  const ctx = useContext(ChangelogContext);
  if (!ctx) throw new Error("useChangelog must be used within ChangelogProvider");
  return ctx;
}
