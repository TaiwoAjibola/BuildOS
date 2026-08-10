// ── Purchase Order payment terms ──────────────────────────────────────────
// Payment terms are picked PER TRANSACTION (PO) from a set of presets, each
// with tranches. The tranche timing also drives the Finance handoff rule:
// a tranche due before delivery ("on_po_approval") lets Finance act at PO
// approval; tranches marked "on_delivery" / net terms wait for goods receipt.

export interface PaymentTranche {
  title: string;
  percent: number;   // 0–100 of the PO amount
  timing: "on_po_approval" | "on_delivery" | "net_30" | "net_60";
}

export interface PaymentTermPreset {
  id: string;
  name: string;
  description: string;
  tranches: PaymentTranche[];
}

export const PAYMENT_TERM_PRESETS: PaymentTermPreset[] = [
  {
    id: "full-delivery",
    name: "Full payment on delivery",
    description: "100% after goods received — Finance pays after GRN / invoice.",
    tranches: [{ title: "On delivery", percent: 100, timing: "on_delivery" }],
  },
  {
    id: "50-50",
    name: "50% deposit + 50% on delivery",
    description: "Half at PO approval, half after delivery.",
    tranches: [
      { title: "Deposit", percent: 50, timing: "on_po_approval" },
      { title: "Balance on delivery", percent: 50, timing: "on_delivery" },
    ],
  },
  {
    id: "30-70",
    name: "30% deposit + 70% on delivery",
    description: "30% at PO approval, balance after delivery.",
    tranches: [
      { title: "Deposit", percent: 30, timing: "on_po_approval" },
      { title: "Balance on delivery", percent: 70, timing: "on_delivery" },
    ],
  },
  {
    id: "net-30",
    name: "Net 30",
    description: "Full amount payable 30 days after delivery.",
    tranches: [{ title: "Net 30 days", percent: 100, timing: "net_30" }],
  },
  {
    id: "net-30-50",
    name: "50% on delivery + 50% Net 30",
    description: "Half at delivery, the remainder within 30 days.",
    tranches: [
      { title: "On delivery", percent: 50, timing: "on_delivery" },
      { title: "Balance Net 30", percent: 50, timing: "net_30" },
    ],
  },
];

export const DEFAULT_PAYMENT_TERM_ID = "full-delivery";

const STORAGE_KEY = "po-default-payment-term";

/** Default payment terms picked in Finance Settings → used when creating POs. */
export function getDefaultPaymentTermId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PAYMENT_TERM_ID;
  } catch {
    return DEFAULT_PAYMENT_TERM_ID;
  }
}

export function setDefaultPaymentTermId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable — default applies */
  }
}

export function getPaymentTerm(id: string): PaymentTermPreset {
  return PAYMENT_TERM_PRESETS.find((p) => p.id === id) ?? PAYMENT_TERM_PRESETS[0];
}

export function tranchesLabel(tranches: PaymentTranche[]): string {
  return tranches.map((t) => `${t.percent}% ${t.title}`).join(" + ");
}

/** A tranche is due BEFORE delivery → Finance can act at PO approval. */
export function isPreDelivery(term: PaymentTermPreset): boolean {
  return term.tranches.some((t) => t.timing === "on_po_approval");
}