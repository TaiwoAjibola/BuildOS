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

const SEED_ENTRIES: ChangelogEntry[] = [
  { id: "seed-1", timestamp: "2026-07-07T10:00:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-001", summary: "1. HR: Removed percentage/member counts from org structure — simplified to just groups/views", performedBy: "System" },
  { id: "seed-2", timestamp: "2026-07-07T10:01:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-002", summary: "2. HR: Merged Leave Type and Claim Type setup into General Setup page", performedBy: "System" },
  { id: "seed-3", timestamp: "2026-07-07T10:02:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-003", summary: "3. HR: Moved General Setup navigation to bottom of HR sidebar (last section)", performedBy: "System" },
  { id: "seed-4", timestamp: "2026-07-07T10:03:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-004", summary: "4. Numbering: Redesigned module numbering to table format with Starting #, Ending #, Increment, Last Used tracking", performedBy: "System" },
  { id: "seed-5", timestamp: "2026-07-07T10:04:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-005", summary: "5. Finance: Made debit/credit fields mutually exclusive in Journal Entry page", performedBy: "System" },
  { id: "seed-6", timestamp: "2026-07-07T10:05:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-006", summary: "6. Finance: Made debit/credit fields mutually exclusive in Accruals page", performedBy: "System" },
  { id: "seed-7", timestamp: "2026-07-07T10:06:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-007", summary: "7. Finance: Renamed 'Zeroize Income Statement Accounts' to 'Generate Closing Entries' in Year End Close step 3", performedBy: "System" },
  { id: "seed-8", timestamp: "2026-07-07T10:07:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-008", summary: "8. Numbering: Updated all 6 config pages (Admin, Finance, HR, Construction, Storefront, Procurement) to use new table-format numbering UI", performedBy: "System" },
  { id: "seed-9", timestamp: "2026-07-07T10:08:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-009", summary: "9. Storefront: Removed ₦ currency symbol from all table data cells — column headers already indicate currency", performedBy: "System" },
  { id: "seed-10", timestamp: "2026-07-07T10:09:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-010", summary: "10. Landing page: Made app grid responsive (adapts columns to filtered app count)", performedBy: "System" },
];

export function ChangelogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ChangelogEntry[]>(SEED_ENTRIES);

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
