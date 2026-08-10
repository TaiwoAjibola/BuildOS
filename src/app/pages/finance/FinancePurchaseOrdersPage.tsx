import { useState } from "react";
import {
  CreditCard, CheckCircle2, Clock, Send, X,
  Building2, FileText, Lock, CheckCircle, BookOpen, Paperclip, PackageCheck, BookOpenCheck,
} from "lucide-react";
import { DataTable, type Column } from "../../components/DataTable";
import { JournalLinesEditor, type JournalLineInput, newJournalLine } from "../../components/JournalLinesEditor";
import { exportCSV } from "../../utils/exportCSV";
import { useChangelog } from "../../stores/changelogStore";
import { useFinance } from "../../stores/financeStore";

// Finance-side purchase order payment workflow. POs listed here have already
// passed Procurement approval and been sent to Finance — Finance does NOT ask
// Procurement to re-approve (actions are View + Pay only).
//
// Handoff by payment schedule (the "later tranche" rule):
//   • on_po_approval  — payment is due before delivery (e.g. deposit tranche):
//                       Finance acts as soon as the signed-off PO lands.
//   • after_delivery  — payment is due after goods receipt / invoice: Finance
//                       waits until the GRN is marked received before paying.
//
// Status vocabulary (spec): New/Open → Send for Approval → Pending Approval →
// Approved → Post → Posted. Approving payment NEVER auto-posts — a balanced
// "Post" is the only step that writes to the ledger.
type FinancePOStatus = "open" | "pending_approval" | "approved" | "posted";

type Handoff = "on_po_approval" | "after_delivery";

interface FinancePO {
  id: string;             // PO number seen in Procurement
  financeRef: string;    // Finance reference assigned on handover
  supplier: string;
  supplierContact: string;
  prRef: string;
  receivedDate: string;
  dueDate: string;
  amount: number;        // Total PO amount
  handoff: Handoff;      // when Finance may start paying
  goodsReceived?: boolean; // GRN received (required for after_delivery POs)
  paidAmount: number;    // already paid in earlier tranches
  status: FinancePOStatus;
  items: { material: string; qty: number; unit: string; unitCost: number }[];
  paymentMethod?: string;
  paymentDate?: string;
  ledgerRef?: string;
  approvedBy?: string;
}

const financePos: FinancePO[] = [
  {
    id: "PO-0033", financeRef: "FIN-0048", supplier: "BuildPlus Supplies", supplierContact: "Ngozi Eze — +234 80 7788 9900",
    prRef: "PR-0021", receivedDate: "Apr 10, 2026", dueDate: "Apr 18, 2026",
    amount: 5800000, handoff: "on_po_approval", paidAmount: 0, status: "open",
    items: [{ material: "Plywood Formwork 18mm", qty: 400, unit: "Sheets", unitCost: 14500 }],
  },
  {
    id: "PO-0032", financeRef: "FIN-0043", supplier: "PlumbTech Ltd", supplierContact: "Yusuf Bello — +234 70 1234 5678",
    prRef: "PR-0020", receivedDate: "Apr 9, 2026", dueDate: "Apr 14, 2026",
    amount: 2750000, handoff: "after_delivery", goodsReceived: true, paidAmount: 0, status: "open",
    items: [{ material: "PVC Pipes 110mm", qty: 200, unit: "Lengths", unitCost: 8500 }, { material: "Sinks & Fittings", qty: 30, unit: "Sets", unitCost: 35000 }],
  },
  {
    id: "PO-0031", financeRef: "FIN-0044", supplier: "CemCo Nigeria Ltd", supplierContact: "Tunde Adeyemi — +234 80 4521 7890",
    prRef: "PR-0018", receivedDate: "Apr 8, 2026", dueDate: "Apr 12, 2026",
    amount: 4500000, handoff: "on_po_approval", paidAmount: 0, status: "pending_approval",
    items: [{ material: "Cement (50kg bags)", qty: 400, unit: "Bags", unitCost: 8500 }, { material: "Concrete Block 9 Inch", qty: 2000, unit: "Units", unitCost: 350 }],
  },
  {
    id: "PO-0030", financeRef: "FIN-0042", supplier: "SteelMart International", supplierContact: "Kene Obi — +234 81 2233 4455",
    prRef: "PR-0017", receivedDate: "Apr 7, 2026", dueDate: "Apr 15, 2026",
    amount: 8250000, handoff: "after_delivery", goodsReceived: true, paidAmount: 0, status: "approved", approvedBy: "Sola Adeleke",
    items: [{ material: "Steel Rebar Y16", qty: 15, unit: "Tonnes", unitCost: 410000 }, { material: "Steel Rebar Y12", qty: 5, unit: "Tonnes", unitCost: 380000 }],
  },
  {
    id: "PO-0029", financeRef: "FIN-0040", supplier: "ElectraHub", supplierContact: "Femi Addo — +234 70 9988 7766",
    prRef: "PR-0016", receivedDate: "Apr 6, 2026", dueDate: "Apr 11, 2026",
    amount: 2225000, handoff: "on_po_approval", paidAmount: 2225000, status: "posted", paymentMethod: "Bank Transfer", paymentDate: "Apr 13, 2026", ledgerRef: "LGR-1010",
    items: [{ material: "Electrical Conduit 25mm", qty: 1500, unit: "Metres", unitCost: 1200 }, { material: "2.5mm Twin Cable", qty: 500, unit: "Metres", unitCost: 850 }],
  },
];

const STATUS_CFG: Record<FinancePOStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  open:              { label: "New/Open",         badge: "bg-gray-100 text-gray-600",       icon: <Clock       className="w-3.5 h-3.5" /> },
  pending_approval:  { label: "Pending Approval", badge: "bg-amber-100 text-amber-700",     icon: <Clock       className="w-3.5 h-3.5" /> },
  approved:          { label: "Approved",         badge: "bg-violet-100 text-violet-700",   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  posted:            { label: "Posted",           badge: "bg-emerald-100 text-emerald-700", icon: <BookOpenCheck className="w-3.5 h-3.5" /> },
};

const HANDOFF_LABEL: Record<Handoff, string> = {
  on_po_approval: "On PO approval",
  after_delivery: "After delivery",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n}`;
}

function fmtFull(n: number) {
  return "₦" + n.toLocaleString();
}

// ── Payment / posting popup ───────────────────────────────────────────────
// Opens on "Pay". Shows the proposed posting lines for the supplier PO and
// walks the payment through Finance approval before it can be posted.
// • "send"  mode — pre-approval. The ONLY action is "Send for Approval";
//   clicking it marks the PO "Pending Approval" (nothing is paid yet).
// • "execute" mode — approval granted. The button becomes "Post to Ledger"
//   which only writes a balanced journal to the ledger.
function PoPaymentModal({ po, mode, onClose, onSendForApproval, onPost }: {
  po: FinancePO;
  mode: "send" | "execute";
  onClose: () => void;
  onSendForApproval: () => void;
  onPost: (lines: JournalLineInput[], method: string, date: string) => void;
}) {
  const { getPostableAccounts, buildProcessPosting } = useFinance();
  const accounts = getPostableAccounts().map(a => ({ code: a.code, name: a.name }));
  const [method, setMethod] = useState(po.paymentMethod ?? "Bank Transfer");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const amountDue = po.amount - po.paidAmount;

  // Process-driven: pre-fill from the "Purchase Order Payment" posting
  // configuration in the Posting Engine. If none exists yet, fall back to the
  // standard DR Accounts Payable / CR Cash template.
  const templateLines = buildProcessPosting("Purchase Order Payment", { "Amount Due": amountDue });
  const seeded: JournalLineInput[] = templateLines.length > 0
    ? templateLines.map(l => ({ id: l.id, account: l.account, debit: l.debit, credit: l.credit, description: `${po.id} — ${po.supplier}` }))
    : [
        { ...newJournalLine(), account: "2110 Accounts Payable", debit: amountDue, credit: 0, description: `${po.id} — ${po.supplier}` },
        { ...newJournalLine(), account: "1110 Cash & Bank", debit: 0, credit: amountDue, description: "Supplier payment" },
      ];
  const [lines, setLines] = useState<JournalLineInput[]>(seeded);

  const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebits > 0 && totalDebits === totalCredits && totalDebits === amountDue;
  const everyLineHasAccount = lines.every(l => l.account);
  const canSubmit = balanced && everyLineHasAccount && method.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "send" ? "Pay Supplier — " : "Post Payment — "}{po.id}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* PO context */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Supplier</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{po.supplier}</p>
              <p className="text-xs text-gray-400 mt-0.5">{po.supplierContact}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Finance Ref · PR Ref</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 font-mono">{po.financeRef}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{po.prRef}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total · Amount Due</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{fmtFull(po.amount)}</p>
              <p className="text-xs font-medium text-emerald-700 mt-0.5">{fmtFull(amountDue)} due</p>
            </div>
          </div>

          {/* Supporting documents (visible to approvers) */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> Supporting documents:</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700">
              <FileText className="w-3.5 h-3.5" /> {po.id} — PO
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700">
              <PackageCheck className="w-3.5 h-3.5" /> GRN
            </span>
          </div>

          {/* Locked payment reference = PO number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Reference</label>
              <input value={po.id} readOnly disabled
                className="w-full px-3 py-2 text-sm font-mono bg-gray-100 text-gray-500 border border-gray-200 rounded-lg cursor-not-allowed"
                title="Locked to purchase order" />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked to PO — cannot be changed
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {["Bank Transfer", "Cheque", "Cash"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Posting lines */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Posting Lines (double-entry)</label>
            <JournalLinesEditor lines={lines} onChange={setLines} accounts={accounts} disabled={mode === "execute"} />
          </div>

          {mode === "send" ? (
            <div className="rounded-lg bg-violet-50 border border-violet-100 p-3 text-sm text-violet-700 flex items-start gap-2">
              <Send className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                This PO already passed <strong>Procurement approval</strong>. Sending for approval asks Finance to review
                the payment before any money moves — nothing is posted at this stage.
              </span>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Payment is <strong>approved</strong>. Posting writes a balanced double-entry to the General Ledger and
                updates Chart of Accounts balances — this is the only step that pays the supplier.
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          {mode === "send" ? (
            <button onClick={onSendForApproval} disabled={!canSubmit}
              className="px-4 py-2 text-sm bg-violet-700 text-white rounded-xl hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              <Send className="w-4 h-4" /> Send for Approval
            </button>
          ) : (
            <button onClick={() => onPost(lines, method, date)} disabled={!canSubmit}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Post to Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export function FinancePurchaseOrdersPage() {
  const { logChange } = useChangelog();
  const { postTransaction } = useFinance();
  const [list, setList] = useState<FinancePO[]>(financePos);
  const [activeTab, setActiveTab] = useState<FinancePOStatus | "all">("all");
  const [payTarget, setPayTarget] = useState<FinancePO | null>(null);

  function openPay(po: FinancePO) {
    if (payTarget) return;
    setPayTarget(po);
  }

  function sendForApproval(po: FinancePO) {
    setList(prev => prev.map(p => p.id === po.id ? { ...p, status: "pending_approval" } : p));
    logChange({ module: "Finance", action: "Payment Sent for Approval", entityType: "PurchaseOrder", entityId: po.id, summary: `PO ${po.id} payment sent for approval (${po.supplier}, ${fmtFull(po.amount)})`, performedBy: "Current User" });
    setPayTarget(null);
  }

  function approvePayment(po: FinancePO) {
    setList(prev => prev.map(p => p.id === po.id ? { ...p, status: "approved", approvedBy: "Sola Adeleke" } : p));
    logChange({ module: "Finance", action: "Payment Approved", entityType: "PurchaseOrder", entityId: po.id, summary: `PO ${po.id} payment approved for posting`, performedBy: "Current User" });
  }

  function postPayment(po: FinancePO, lines: JournalLineInput[], method: string, date: string) {
    const ledgerRef = `LGR-${Math.floor(Math.random() * 9000) + 1000}`;
    const txn = postTransaction({
      id: ledgerRef,
      type: "Payment",
      description: `Supplier payment — ${po.supplier} (${po.id})`,
      reference: po.id,
      date,
      createdBy: "Current User",
      sourceApp: "Finance",
      sourceProcess: "Purchase Order Payment",
      lines: lines.map(l => ({ id: l.id, account: l.account, debit: l.debit, credit: l.credit, description: l.description })),
      linkedRecords: [{ label: "Purchase Order", ref: po.id }],
    });
    if (!txn) return;
    setList(prev => prev.map(p => p.id === po.id ? { ...p, status: "posted", paidAmount: po.amount, ledgerRef: txn.id, paymentMethod: method, paymentDate: date } : p));
    logChange({ module: "Finance", action: "Payment Posted", entityType: "PurchaseOrder", entityId: po.id, summary: `PO ${po.id} paid — posted to ledger ${txn.id}`, performedBy: "Current User" });
    setPayTarget(null);
  }

  const filtered = list.filter(po => activeTab === "all" || po.status === activeTab);

  const columns: Column<FinancePO>[] = [
    {
      key: "id", label: "PO ID", sortable: true, filterable: true,
      render: (po) => <span className="font-mono text-xs font-semibold text-gray-900">{po.id}</span>,
    },
    {
      key: "supplier", label: "Supplier / Vendor", sortable: true, filterable: true,
      render: (po) => (
        <div>
          <p className="font-medium text-gray-900">{po.supplier}</p>
          <p className="text-xs text-gray-400">{po.supplierContact}</p>
        </div>
      ),
    },
    {
      key: "items", label: "Items", sortable: false, filterable: true, minWidth: 220,
      render: (po) => (
        <div className="text-sm text-gray-600">
          {po.items.length} item{po.items.length > 1 ? "s" : ""}: {po.items.map(it => it.material).join(", ")}
        </div>
      ),
    },
    {
      key: "amount", label: "Total", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (po) => <span className="font-semibold text-gray-900">{fmtFull(po.amount)}</span>,
    },
    {
      key: "amountDue", label: "Amount Due", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (po) => {
        const due = po.amount - po.paidAmount;
        return <span className={due > 0 ? "text-amber-700 font-semibold" : "text-gray-400"}>{fmtFull(due)}</span>;
      },
    },
    {
      key: "balance", label: "Balance", sortable: true, className: "text-right", headerClassName: "text-right",
      render: (po) => <span className={po.paidAmount > 0 ? "text-emerald-700" : "text-gray-400"}>{fmtFull(po.amount - po.paidAmount)}</span>,
    },
    {
      key: "handoff", label: "Payment Trigger", sortable: true, filterable: true,
      render: (po) => (
        <div>
          <span className="text-xs text-gray-600">{HANDOFF_LABEL[po.handoff]}</span>
          {po.handoff === "after_delivery" && !po.goodsReceived && (
            <p className="text-[10px] text-red-500 mt-0.5">Awaiting goods receipt</p>
          )}
        </div>
      ),
    },
    {
      key: "status", label: "Status", sortable: true, filterable: true,
      render: (po) => {
        const cfg = STATUS_CFG[po.status];
        return (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}>
            {cfg.icon}{cfg.label}
          </span>
        );
      },
    },
    {
      key: "actions", label: "", sortable: false, filterable: false,
      render: (po) => {
        // Handoff gate: after_delivery POs cannot be paid until the GRN is in.
        if (po.handoff === "after_delivery" && !po.goodsReceived) {
          return <span className="text-xs text-gray-400 flex items-center gap-1"><PackageCheck className="w-3.5 h-3.5" /> Awaiting GRN</span>;
        }
        if (po.status === "open") {
          return <button onClick={(e) => { e.stopPropagation(); openPay(po); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" title="Start payment approval"><CreditCard className="w-3.5 h-3.5" /> Pay</button>;
        }
        if (po.status === "pending_approval") {
          return <button onClick={(e) => { e.stopPropagation(); approvePayment(po); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors" title="Approve payment for posting"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>;
        }
        if (po.status === "approved") {
          return <button onClick={(e) => { e.stopPropagation(); openPay(po); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" title="Post approved payment"><BookOpen className="w-3.5 h-3.5" /> Post</button>;
        }
        return <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Posted {po.ledgerRef}</span>;
      },
    },
  ];

  function handleExport() {
    const headers = ["PO ID", "Finance Ref", "PR Ref", "Supplier", "Status", "Total", "Due", "Paid", "Received Date", "Due Date", "Ledger Ref"];
    const rows = filtered.map(po => [
      po.id, po.financeRef, po.prRef, po.supplier, STATUS_CFG[po.status].label,
      String(po.amount), String(po.amount - po.paidAmount), String(po.paidAmount), po.receivedDate, po.dueDate, po.ledgerRef ?? "",
    ]);
    exportCSV("finance-purchase-orders", headers, rows);
  }

  const notPosted = list.filter(p => p.status !== "posted");
  const totalDue = notPosted.reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const pendingApproval = list.filter(p => p.status === "pending_approval").length;
  const approvedForPosting = list.filter(p => p.status === "approved").length;
  const totalPosted = list.filter(p => p.status === "posted").reduce((s, p) => s + p.paidAmount, 0);

  const tabs: { key: FinancePOStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "New/Open" },
    { key: "pending_approval", label: "Pending Approval" },
    { key: "approved", label: "Approved" },
    { key: "posted", label: "Posted" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders — Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Signed-off POs from Procurement · Finance approves and posts end-to-end</p>
        </div>
      </div>

      {/* Handover banner — no re-approval needed */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-start gap-3">
        <Building2 className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-sky-900">
          <p className="font-semibold">Already approved in Procurement — finance does not re-ask for approval (View + Pay only).</p>
          <p className="mt-0.5 text-sky-700">
            POs due <strong>before delivery</strong> reach Finance at PO approval. POs due <strong>after delivery</strong> wait for the
            goods receipt / invoice. Either way the payment goes <strong>Send for Approval → Approved → Post</strong> — posting is the only step that pays.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open POs", value: notPosted.length, sub: fmtFull(totalDue) + " due", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Pending Approval", value: pendingApproval, sub: "Awaiting sign-off", color: "bg-violet-50 border-violet-200 text-violet-700" },
          { label: "Approved — Ready to Post", value: approvedForPosting, sub: "Post to pay", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Posted to Ledger", value: list.filter(p => p.status === "posted").length, sub: fmtFull(totalPosted) + " posted", color: "bg-gray-50 border-gray-200 text-gray-900" },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-lg border ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
            <p className="text-xs mt-0.5 opacity-60">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => {
          const count = tab.key === "all" ? list.length : list.filter(po => po.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-emerald-700 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label} <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <DataTable<FinancePO>
        columns={columns}
        data={filtered}
        keyExtractor={(po) => po.id}
        searchPlaceholder="Search PO ID, supplier, or item…"
        searchFields={[po => po.id, po => po.supplier, po => po.items.map(i => i.material).join(" ")]}
        headerExtra={
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      />

      {payTarget && (
        <PoPaymentModal
          po={payTarget}
          mode={payTarget.status === "open" ? "send" : "execute"}
          onClose={() => setPayTarget(null)}
          onSendForApproval={() => sendForApproval(payTarget)}
          onPost={(lines, method, date) => postPayment(payTarget, lines, method, date)}
        />
      )}
    </div>
  );
}