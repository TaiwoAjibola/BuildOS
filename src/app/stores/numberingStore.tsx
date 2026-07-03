import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ModuleNumbering {
  module: string;
  prefix: string;
  separator: string;
  padLength: number;
  nextNumber: number;
  description: string;
}

interface NumberingContextValue {
  configs: ModuleNumbering[];
  getNextId: (module: string) => string;
  updateConfig: (module: string, updates: Partial<ModuleNumbering>) => void;
  resetConfig: (module: string) => void;
}

const NumberingContext = createContext<NumberingContextValue | null>(null);

const DEFAULT_CONFIGS: ModuleNumbering[] = [
  { module: "Expense", prefix: "EXP", separator: "-", padLength: 4, nextNumber: 52, description: "Expense records (e.g., EXP-0051)" },
  { module: "Income", prefix: "INC", separator: "-", padLength: 4, nextNumber: 22, description: "Income records (e.g., INC-0021)" },
  { module: "Budget", prefix: "BDG", separator: "-", padLength: 4, nextNumber: 1, description: "Budget records (e.g., BDG-0001)" },
  { module: "Claim", prefix: "CLM", separator: "-", padLength: 4, nextNumber: 1, description: "Claims (e.g., CLM-0001)" },
  { module: "Payment", prefix: "PAY", separator: "-", padLength: 4, nextNumber: 1, description: "Payment records (e.g., PAY-0001)" },
  { module: "JournalEntry", prefix: "JE", separator: "-", padLength: 3, nextNumber: 5, description: "Journal entries (e.g., JE-005)" },
  { module: "PurchaseOrder", prefix: "PO", separator: "-", padLength: 3, nextNumber: 1, description: "Purchase orders (e.g., PO-001)" },
  { module: "PurchaseRequest", prefix: "PR", separator: "-", padLength: 3, nextNumber: 1, description: "Purchase requests (e.g., PR-001)" },
  { module: "PurchaseInvoice", prefix: "INV", separator: "-", padLength: 3, nextNumber: 1, description: "Purchase invoices (e.g., INV-001)" },
  { module: "PayrollRun", prefix: "PRL", separator: "-", padLength: 3, nextNumber: 1, description: "Payroll runs (e.g., PRL-001)" },
  { module: "Accrual", prefix: "ACCR", separator: "-", padLength: 4, nextNumber: 1, description: "Accruals (e.g., ACCR-0001)" },
  { module: "Transaction", prefix: "TXN", separator: "-", padLength: 4, nextNumber: 42, description: "Ledger transactions (e.g., TXN-0041)" },
];

export function NumberingProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<ModuleNumbering[]>(DEFAULT_CONFIGS);

  const getNextId = useCallback((module: string) => {
    let result = "";
    setConfigs(prev => {
      const idx = prev.findIndex(c => c.module === module);
      if (idx < 0) return prev;
      const cfg = prev[idx];
      const padded = String(cfg.nextNumber).padStart(cfg.padLength, "0");
      result = `${cfg.prefix}${cfg.separator}${padded}`;
      const next = [...prev];
      next[idx] = { ...cfg, nextNumber: cfg.nextNumber + 1 };
      return next;
    });
    return result;
  }, []);

  const updateConfig = useCallback((module: string, updates: Partial<ModuleNumbering>) => {
    setConfigs(prev => prev.map(c => c.module === module ? { ...c, ...updates } : c));
  }, []);

  const resetConfig = useCallback((module: string) => {
    const def = DEFAULT_CONFIGS.find(c => c.module === module);
    if (def) updateConfig(module, def);
  }, [updateConfig]);

  return (
    <NumberingContext.Provider value={{ configs, getNextId, updateConfig, resetConfig }}>
      {children}
    </NumberingContext.Provider>
  );
}

export function useNumbering() {
  const ctx = useContext(NumberingContext);
  if (!ctx) throw new Error("useNumbering must be used within NumberingProvider");
  return ctx;
}
