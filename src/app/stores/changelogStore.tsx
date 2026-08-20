import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

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
  /** Optional explicit app route the entry points to (falls back to a module/entity map). */
  pageRoute?: string;
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
  { id: "seed-11", timestamp: "2026-07-07T11:00:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-011", summary: "11. Numbering: Replaced text input with dropdown selector in all config pages — pick from curated module list per domain (Finance, HR, Construction, Procurement, Storefront, Admin). Fixed broken filters that showed empty tables.", performedBy: "System" },
  { id: "seed-12", timestamp: "2026-07-08T08:00:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-012", summary: "12. Numbering: Split 'Numbering Template' column into 'Process' (dropdown) + 'Template' (text input). Template defines the ID format with {N:W} placeholder (e.g. 'EXP-{N:4}'). Last Used # renders using the template.", performedBy: "System" },
  { id: "seed-13", timestamp: "2026-07-12T12:00:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-013", summary: "13. Settings restructure: Renamed all module config pages to SettingsPage convention, converted to tab-based all-in-one layout (Finance, HR, Procurement, Construction, Admin, Storefront), merged admin email config into AdminSettingsPage Email tab, updated all sidebar nav links and routes to /settings.", performedBy: "System" },
  { id: "seed-14", timestamp: "2026-07-21T14:00:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-014", summary: "14. Employee lifecycle: Restructured employee creation — HR now creates complete records with General/Contact/Payment details (firstName, middleName, lastName, jobTitle, supervisor, employmentDate, DOB, maritalStatus, phone, email, address, nextOfKin, PFA, RSA, bank, taxId, grade, nationality). New employeeStore shares data between HR and Admin. Admin Users page shows employees from HR with Synced/Unsynced status and a Sync Employee panel to create user accounts with role-based permissions. Updated EmployeeProfilePage to display all new fields.", performedBy: "System" },
  { id: "seed-15", timestamp: "2026-08-11T08:00:00.000Z", module: "Finance", action: "CHANGELOG", entityType: "System", entityId: "UPD-015", summary: "15. Purchase Order payments end-to-end: Finance PO screen is View + Pay only (no re-approval from Procurement), statuses New/Open → Send for Approval → Pending Approval → Approved → Post → Posted. Paying is a two-step Send-for-Approval then balanced Post; 'Confirm & Post' removed across Finance PO, Payroll ('Post to Ledger') and Purchase Invoice (Send for Approval → Approve Payment → Post). Columns show Total vs Amount Due vs Balance plus the Payment Trigger.", performedBy: "System" },
  { id: "seed-16", timestamp: "2026-08-11T08:05:00.000Z", module: "Procurement", action: "CHANGELOG", entityType: "System", entityId: "UPD-016", summary: "16. Purchase orders are now formal documents: company letterhead, ship-to/delivery details, line items, payment terms and a Procurement Manager signature block, downloadable as PDF via print. Payment terms are chosen per PO from configurable tranche presets, defaulting from Finance Settings.", performedBy: "System" },
  { id: "seed-17", timestamp: "2026-08-11T08:10:00.000Z", module: "Procurement", action: "CHANGELOG", entityType: "System", entityId: "UPD-017", summary: "17. Goods Received Notes are formal documents: company letterhead, linked PO/MR references, delivery note + warehouse, received/accepted/rejected lines and a signature block, downloadable as PDF via print.", performedBy: "System" },
  { id: "seed-18", timestamp: "2026-08-11T08:15:00.000Z", module: "Procurement", action: "CHANGELOG", entityType: "System", entityId: "UPD-018", summary: "18. MR/PR dedup and traceability: one MR raises one PR; duplicate raises are blocked, similar raises show a warning, and PRs block a second raise on the same MR reference. Raised PRs link back to their MR.", performedBy: "System" },
  { id: "seed-19", timestamp: "2026-08-11T08:20:00.000Z", module: "Finance", action: "CHANGELOG", entityType: "System", entityId: "UPD-019", summary: "19. Finance handoff is driven by a shared Procurement store: POs sent to Finance appear on the Finance PO screen automatically, the payment trigger follows the PO's payment term (deposit tranche → act at PO approval, else wait for delivery), and the goods-received gate is computed from the real recorded GRNs.", performedBy: "System" },
  { id: "seed-20", timestamp: "2026-08-11T08:25:00.000Z", module: "Finance", action: "CHANGELOG", entityType: "System", entityId: "UPD-020", summary: "20. Posting Engine posts through Process Account Mapping: PO payments build lines from the 'Purchase Order Payment' mapping and payroll from granular mappings (Basic Salary + Allowances → Labour Costs, PAYE → WHT, Net → Cash). Posting configurations can be edited, and the engine falls back to the category DR/CR pair only when no mapping exists.", performedBy: "System" },
  { id: "seed-21", timestamp: "2026-08-11T08:30:00.000Z", module: "Admin", action: "CHANGELOG", entityType: "System", entityId: "UPD-021", summary: "21. Changelog now persists across page reloads (localStorage) and every entry deep-links to the page where the change was made — full Purchase Order payment posted to a balanced journal updates the General Ledger and Chart of Accounts, with the posting visible in the ledger.", performedBy: "System" },
  { id: "seed-22", timestamp: "2026-08-20T09:00:00.000Z", module: "Storefront", action: "CHANGELOG", entityType: "System", entityId: "UPD-022", summary: "22. Storefront material catalogue redesign: Material Categories now classify each material Consumable/Reusable and define types with measurable dimensions (standard, value, unit — e.g. 9 inch Thickness, 2440×1220×12mm, Custom finish), sharing a single catalogue store across Settings and All Materials. All Materials shows Total/Available/Reserved Qty and Unit Cost per row, expands the material name to reveal its catalogue types, and adds materials via a search-and-select picker that auto-fills category, name, type and unit.", performedBy: "System" },
];

const STORAGE_KEY = "buildos-changelog-v3";

function loadInitialEntries(): ChangelogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as ChangelogEntry[];
    }
  } catch {
    /* fall through to seeds */
  }
  return SEED_ENTRIES;
}

export function ChangelogProvider({ children }: { children: ReactNode }) {
  // Persisted to localStorage so logged changes survive page reloads — this is
  // also how the "Changelog" page keeps showing entries made in other modules.
  const [entries, setEntries] = useState<ChangelogEntry[]>(loadInitialEntries);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* storage unavailable — in-memory only */
    }
  }, [entries]);

  const logChange = useCallback((entry: Omit<ChangelogEntry, "id" | "timestamp">) => {
    setEntries(prev => [{
      id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }, ...prev]);
  }, []);

  const getByModule = useCallback((module: string) =>
    entries.filter(e => e.module.toLowerCase() === module.toLowerCase()),
  [entries]);

  const getByEntity = useCallback((entityType: string, entityId: string) =>
    entries.filter(e => e.entityType === entityType && e.entityId === entityId),
  [entries]);

  const clearAll = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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
