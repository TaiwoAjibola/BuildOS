import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  PAYMENT_TERM_PRESETS, DEFAULT_PAYMENT_TERM_ID,
  type PaymentTermPreset, type PaymentTranche,
} from "../config/paymentTerms";

// ── Procurement configuration (payment terms + signatories) ───────────────
// Hoisted in AppLayout so Procurement Settings and the PO creation flow
// (NewPOModal, quote→PO) all read the SAME reactive configuration. PO preset
// terms ship with the app; the Settings page adds/edits/deletes and users can
// also define custom terms inline when setting up a PO. Signatories picked in
// Settings are attachable to a PO and render on its formal document.

export interface Signatory {
  id: string;
  name: string;
  role: string;
  department?: string;
}

export const SIGNATORY_ROLES = [
  "Procurement Manager",
  "Procurement Officer",
  "Finance Director",
  "Accounts Officer",
  "Store Manager",
  "Project Manager",
  "Managing Director",
];

export const SEED_SIGNATORIES: Signatory[] = [
  { id: "sig-001", name: "Amaka Osei",  role: "Procurement Manager", department: "Procurement" },
  { id: "sig-002", name: "Sola Adeleke", role: "Finance Director",    department: "Finance" },
  { id: "sig-003", name: "Ngozi Okafor", role: "Accounts Officer",    department: "Finance" },
  { id: "sig-004", name: "Chukwudi Eze", role: "Store Manager",       department: "Procurement" },
];

const STORAGE_KEY = "po-default-payment-term";

function readDefaultTermId(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && PAYMENT_TERM_PRESETS.some(t => t.id === v) ? v : DEFAULT_PAYMENT_TERM_ID;
  } catch {
    return DEFAULT_PAYMENT_TERM_ID;
  }
}

interface ProcurementSettingsContextValue {
  paymentTerms: PaymentTermPreset[];
  setPaymentTerms: Dispatch<SetStateAction<PaymentTermPreset[]>>;
  addPaymentTerm: (term: PaymentTermPreset) => void;
  updatePaymentTerm: (id: string, patch: Partial<PaymentTermPreset>) => void;
  deletePaymentTerm: (id: string) => void;
  getPaymentTerm: (id: string) => PaymentTermPreset;
  defaultPaymentTermId: string;
  setDefaultPaymentTermId: (id: string) => void;
  signatories: Signatory[];
  setSignatories: Dispatch<SetStateAction<Signatory[]>>;
  addSignatory: (s: Signatory) => void;
  updateSignatory: (id: string, patch: Partial<Signatory>) => void;
  deleteSignatory: (id: string) => void;
  signatoriesFor: (names: string[]) => Signatory[];
}

const ProcurementSettingsContext = createContext<ProcurementSettingsContextValue | undefined>(undefined);

const FALLBACK_TERM: PaymentTermPreset = PAYMENT_TERM_PRESETS[0];

export function ProcurementSettingsProvider({ children }: { children: ReactNode }) {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermPreset[]>(PAYMENT_TERM_PRESETS);
  const [defaultPaymentTermId, setDefaultPaymentTermIdState] = useState<string>(readDefaultTermId());
  const [signatories, setSignatories] = useState<Signatory[]>(SEED_SIGNATORIES);

  const addPaymentTerm = (term: PaymentTermPreset) =>
    setPaymentTerms(prev => prev.some(t => t.id === term.id) ? prev : [...prev, term]);

  const updatePaymentTerm = (id: string, patch: Partial<PaymentTermPreset>) =>
    setPaymentTerms(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const deletePaymentTerm = (id: string) => {
    setPaymentTerms(prev => prev.filter(t => t.id !== id));
    setDefaultPaymentTermIdState(cur => cur === id ? DEFAULT_PAYMENT_TERM_ID : cur);
  };

  const getPaymentTerm = (id: string): PaymentTermPreset =>
    paymentTerms.find(t => t.id === id) ?? paymentTerms.find(t => t.id === DEFAULT_PAYMENT_TERM_ID) ?? FALLBACK_TERM;

  const setDefaultPaymentTermId = (id: string) => {
    setDefaultPaymentTermIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable — default applies for this session */
    }
  };

  const addSignatory = (s: Signatory) =>
    setSignatories(prev => prev.some(x => x.id === s.id) ? prev : [...prev, s]);

  const updateSignatory = (id: string, patch: Partial<Signatory>) =>
    setSignatories(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const deleteSignatory = (id: string) =>
    setSignatories(prev => prev.filter(s => s.id !== id));

  const signatoriesFor = (names: string[]): Signatory[] =>
    names.map(n => signatories.find(s => s.name === n)).filter((s): s is Signatory => !!s);

  return (
    <ProcurementSettingsContext.Provider
      value={{
        paymentTerms, setPaymentTerms, addPaymentTerm, updatePaymentTerm, deletePaymentTerm, getPaymentTerm,
        defaultPaymentTermId, setDefaultPaymentTermId,
        signatories, setSignatories, addSignatory, updateSignatory, deleteSignatory, signatoriesFor,
      }}>
      {children}
    </ProcurementSettingsContext.Provider>
  );
}

export function useProcurementSettings() {
  const ctx = useContext(ProcurementSettingsContext);
  if (!ctx) throw new Error("useProcurementSettings must be used within ProcurementSettingsProvider");
  return ctx;
}

export { type PaymentTermPreset, type PaymentTranche };
export { tranchesLabel, isPreDelivery } from "../config/paymentTerms";