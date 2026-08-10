import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

// ── Shared Procurement state (POs + Goods Receipts) ───────────────────────
// Single source of truth for the Purchase Order lifecycle and Goods Received
// Notes. Hoisted in AppLayout so Procurement pages and the Finance "Purchase
// Orders — Payments" screen all read the SAME records — that is what powers
// the Finance handoff: a PO reaches Finance when `sentToFinance` flips true,
// and a PO is considered "goods received" when a GRN for it has received > 0.

export type POStatus = "draft" | "sent" | "confirmed" | "partially_received" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "confirmation_requested" | "paid";
export type POItem = { material: string; qty: number; unit: string; unitCost: number; received: number };

export interface PurchaseOrder {
  id: string; prRef: string; mrRef: string; supplier: string; supplierContact: string;
  status: POStatus; paymentStatus: PaymentStatus; sentToFinance: boolean; financeRef?: string;
  paymentTermId: string;
  createdBy: string; createdDate: string; expectedDate: string;
  totalItems: number; totalValue: number; receivedValue: number;
  items: POItem[];
}

export type GRNStatus = "pending" | "partial" | "completed" | "over_supply";
export type GRNItem = { material: string; ordered: number; received: number; accepted: number; rejected: number; unit: string; reason?: string };
export interface GRN {
  id: string; poRef: string; mrRef: string; supplier: string; receivedBy: string; receivedDate: string;
  status: GRNStatus; warehouse: string; deliveryNote: string;
  items: GRNItem[];
}

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-0033", prRef: "PR-0021", mrRef: "MR-0040",
    supplier: "CemCo Nigeria Ltd", supplierContact: "Tunde Adeyemi — +234 80 4521 7890",
    status: "confirmed", paymentStatus: "unpaid", sentToFinance: true, financeRef: "FIN-0048", paymentTermId: "50-50",
    createdBy: "Amaka Osei", createdDate: "Apr 10, 2026", expectedDate: "Apr 18, 2026",
    totalItems: 2, totalValue: 4100000, receivedValue: 0,
    items: [
      { material: "Cement (50kg bags)",    qty: 400,  unit: "Bags",  unitCost: 8500, received: 0 },
      { material: "Concrete Block 9 Inch", qty: 2000, unit: "Units", unitCost: 350,  received: 0 },
    ],
  },
  {
    id: "PO-0032", prRef: "PR-0020", mrRef: "MR-0039",
    supplier: "PlumbTech Ltd", supplierContact: "Yusuf Bello — +234 70 1234 5678",
    status: "confirmed", paymentStatus: "unpaid", sentToFinance: true, financeRef: "FIN-0043", paymentTermId: "full-delivery",
    createdBy: "Amaka Osei", createdDate: "Apr 9, 2026", expectedDate: "Apr 14, 2026",
    totalItems: 2, totalValue: 2750000, receivedValue: 2750000,
    items: [
      { material: "PVC Pipes 110mm", qty: 200, unit: "Lengths", unitCost: 8500, received: 200 },
      { material: "Sinks & Fittings", qty: 30,  unit: "Sets",    unitCost: 35000, received: 30 },
    ],
  },
  {
    id: "PO-0031", prRef: "PR-0018", mrRef: "MR-0038",
    supplier: "SteelMart International", supplierContact: "Kene Obi — +234 81 2233 4455",
    status: "confirmed", paymentStatus: "unpaid", sentToFinance: true, financeRef: "FIN-0042", paymentTermId: "50-50",
    createdBy: "Amaka Osei", createdDate: "Apr 8, 2026", expectedDate: "Apr 15, 2026",
    totalItems: 2, totalValue: 8050000, receivedValue: 0,
    items: [
      { material: "Steel Rebar Y16", qty: 15, unit: "Tonnes", unitCost: 410000, received: 0 },
      { material: "Steel Rebar Y12", qty: 5,  unit: "Tonnes", unitCost: 380000, received: 0 },
    ],
  },
  {
    id: "PO-0030", prRef: "PR-0016", mrRef: "MR-0033",
    supplier: "ElectraHub", supplierContact: "Femi Addo — +234 70 9988 7766",
    status: "partially_received", paymentStatus: "confirmation_requested", sentToFinance: true, financeRef: "FIN-0040", paymentTermId: "net-30",
    createdBy: "Amaka Osei", createdDate: "Apr 6, 2026", expectedDate: "Apr 11, 2026",
    totalItems: 2, totalValue: 2225000, receivedValue: 1275000,
    items: [
      { material: "Electrical Conduit 25mm", qty: 1500, unit: "Metres", unitCost: 1200, received: 800 },
      { material: "2.5mm Twin Cable",        qty: 500,  unit: "Metres", unitCost: 850,  received: 500 },
    ],
  },
  {
    id: "PO-0029", prRef: "PR-0015", mrRef: "MR-0031",
    supplier: "Alpha Aggregates", supplierContact: "Lawal Musa — +234 81 5566 7788",
    status: "completed", paymentStatus: "paid", sentToFinance: true, financeRef: "FIN-0041", paymentTermId: "full-delivery",
    createdBy: "Amaka Osei", createdDate: "Apr 5, 2026", expectedDate: "Apr 9, 2026",
    totalItems: 2, totalValue: 2900000, receivedValue: 2900000,
    items: [
      { material: "Sand (River)",     qty: 60, unit: "Tonnes", unitCost: 25000, received: 60 },
      { material: "Granite 3/4 Inch", qty: 40, unit: "Tonnes", unitCost: 35000, received: 40 },
    ],
  },
  {
    id: "PO-0028", prRef: "PR-0014", mrRef: "MR-0030",
    supplier: "BuildPlus Supplies", supplierContact: "Ngozi Eze — +234 80 7788 9900",
    status: "confirmed", paymentStatus: "unpaid", sentToFinance: true, financeRef: "FIN-0047", paymentTermId: "full-delivery",
    createdBy: "Amaka Osei", createdDate: "Apr 9, 2026", expectedDate: "Apr 18, 2026",
    totalItems: 1, totalValue: 5800000, receivedValue: 0,
    items: [
      { material: "Plywood Formwork 18mm", qty: 400, unit: "Sheets", unitCost: 14500, received: 0 },
    ],
  },
  {
    id: "PO-0027", prRef: "PR-0013", mrRef: "MR-0027",
    supplier: "TileWorld", supplierContact: "Bisi Akinola — +234 70 8877 6655",
    status: "draft", paymentStatus: "unpaid", sentToFinance: false, paymentTermId: "full-delivery",
    createdBy: "Amaka Osei", createdDate: "Apr 9, 2026", expectedDate: "Apr 20, 2026",
    totalItems: 1, totalValue: 2850000, receivedValue: 0,
    items: [
      { material: "Ceramic Floor Tiles 60cm", qty: 300, unit: "Cartons", unitCost: 9500, received: 0 },
    ],
  },
  {
    id: "PO-0026", prRef: "PR-0012", mrRef: "MR-0026",
    supplier: "SteelMart International", supplierContact: "Kene Obi — +234 81 2233 4455",
    status: "sent", paymentStatus: "unpaid", sentToFinance: false, paymentTermId: "full-delivery",
    createdBy: "Amaka Osei", createdDate: "Apr 8, 2026", expectedDate: "Apr 16, 2026",
    totalItems: 1, totalValue: 1200000, receivedValue: 0,
    items: [
      { material: "Binding Wire", qty: 100, unit: "Rolls", unitCost: 12000, received: 0 },
    ],
  },
  {
    id: "PO-0025", prRef: "PR-0011", mrRef: "MR-0025",
    supplier: "BuildPlus Supplies", supplierContact: "Ngozi Eze — +234 80 7788 9900",
    status: "confirmed", paymentStatus: "unpaid", sentToFinance: false, paymentTermId: "net-30",
    createdBy: "Amaka Osei", createdDate: "Apr 7, 2026", expectedDate: "Apr 14, 2026",
    totalItems: 1, totalValue: 1750000, receivedValue: 0,
    items: [
      { material: "Timber Formwork 4x4", qty: 500, unit: "Lengths", unitCost: 3500, received: 0 },
    ],
  },
];

export const SEED_GRNS: GRN[] = [
  {
    id: "GRN-0031", poRef: "PO-0033", mrRef: "MR-0040",
    supplier: "CemCo Nigeria Ltd", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 9, 2026", status: "pending", warehouse: "Main Store", deliveryNote: "DN-CEM-9042",
    items: [
      { material: "Cement (50kg bags)",    ordered: 400,  received: 0, accepted: 0, rejected: 0, unit: "Bags" },
      { material: "Concrete Block 9 Inch", ordered: 2000, received: 0, accepted: 0, rejected: 0, unit: "Units" },
    ],
  },
  {
    id: "GRN-0030", poRef: "PO-0030", mrRef: "MR-0033",
    supplier: "ElectraHub", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 8, 2026", status: "partial", warehouse: "Electrical Store", deliveryNote: "DN-ELEC-7831",
    items: [
      { material: "Electrical Conduit 25mm", ordered: 1500, received: 800, accepted: 800, rejected: 0,  unit: "Metres" },
      { material: "2.5mm Twin Cable",        ordered: 500,  received: 500, accepted: 490, rejected: 10, unit: "Metres", reason: "10m damaged on delivery" },
    ],
  },
  {
    id: "GRN-0029", poRef: "PO-0029", mrRef: "MR-0031",
    supplier: "Alpha Aggregates", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 8, 2026", status: "completed", warehouse: "Yard B", deliveryNote: "DN-AGG-5512",
    items: [
      { material: "Sand (River)",     ordered: 60, received: 60, accepted: 60, rejected: 0, unit: "Tonnes" },
      { material: "Granite 3/4 Inch", ordered: 40, received: 40, accepted: 40, rejected: 0, unit: "Tonnes" },
    ],
  },
  {
    id: "GRN-0028", poRef: "PO-0026", mrRef: "MR-0026",
    supplier: "SteelMart International", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 7, 2026", status: "over_supply", warehouse: "Shed 1", deliveryNote: "DN-STL-3301",
    items: [
      { material: "Binding Wire",  ordered: 100, received: 120, accepted: 120, rejected: 0, unit: "Rolls",  reason: "Supplier delivered 20 extra rolls" },
      { material: "BRC Mesh A193", ordered: 50,  received: 50,  accepted: 50,  rejected: 0, unit: "Sheets" },
    ],
  },
  {
    id: "GRN-0027", poRef: "PO-0025", mrRef: "MR-0025",
    supplier: "BuildPlus Supplies", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 7, 2026", status: "partial", warehouse: "Timber Yard", deliveryNote: "DN-BUILD-2290",
    items: [
      { material: "Timber Formwork 4x4", ordered: 500, received: 120, accepted: 110, rejected: 10, unit: "Lengths", reason: "10 lengths warped/water-damaged" },
    ],
  },
  {
    id: "GRN-0026", poRef: "PO-0032", mrRef: "MR-0039",
    supplier: "PlumbTech Ltd", receivedBy: "Chukwudi Eze",
    receivedDate: "Apr 10, 2026", status: "completed", warehouse: "Plumbing Store", deliveryNote: "DN-PLUMB-4011",
    items: [
      { material: "PVC Pipes 110mm", ordered: 200, received: 200, accepted: 200, rejected: 0, unit: "Lengths" },
      { material: "Sinks & Fittings", ordered: 30,  received: 30,  accepted: 30,  rejected: 0, unit: "Sets" },
    ],
  },
];

interface ProcurementContextValue {
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrder[]>>;
  grns: GRN[];
  setGrns: Dispatch<SetStateAction<GRN[]>>;
}

const ProcurementContext = createContext<ProcurementContextValue | undefined>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(SEED_PURCHASE_ORDERS);
  const [grns, setGrns] = useState<GRN[]>(SEED_GRNS);

  return (
    <ProcurementContext.Provider value={{ purchaseOrders, setPurchaseOrders, grns, setGrns }}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error("useProcurement must be used within ProcurementProvider");
  return ctx;
}
