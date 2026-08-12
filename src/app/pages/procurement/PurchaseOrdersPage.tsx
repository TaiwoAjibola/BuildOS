import { useState } from "react";
import {
  ShoppingCart, Plus, Search, ChevronDown, ChevronRight,
  FileText, Truck, CheckCircle, Clock, XCircle, Send, Download, Package, X, Trash2,
  Building2, LinkIcon, DownloadCloud,
} from "lucide-react";
import { DataTable, type Column } from "../../components/DataTable";
import { useChangelog } from "../../stores/changelogStore";
import { exportCSV } from "../../utils/exportCSV";
import { useNavigate } from "react-router";
import { useNumbering, formatId } from "../../stores/numberingStore";
import { useProcurementSettings, tranchesLabel, type PaymentTermPreset, type Signatory } from "../../stores/procurementSettingsStore";
import { useProcurement } from "../../stores/procurementStore";
import { PurchaseOrderPaper, printPoDocument } from "../../components/PurchaseOrderDocument";

type POStatus = "draft" | "sent" | "confirmed" | "partially_received" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "confirmation_requested" | "paid";

interface PurchaseOrder {
  id: string; prRef: string; mrRef: string; supplier: string; supplierContact: string;
  status: POStatus; paymentStatus: PaymentStatus; sentToFinance: boolean; financeRef?: string;
  created?: boolean;
  paymentTermId: string;
  signatories?: string[];
  createdBy: string; createdDate: string; expectedDate: string;
  totalItems: number; totalValue: number; receivedValue: number;
  items: { material: string; qty: number; unit: string; unitCost: number; received: number }[];
}

const PAYMENT_STATUS_CFG: Record<PaymentStatus, { label: string; badge: string }> = {
  unpaid:                  { label: "Unpaid",               badge: "bg-gray-100 text-gray-500" },
  confirmation_requested:  { label: "Payment Requested",    badge: "bg-amber-100 text-amber-700" },
  paid:                    { label: "Paid",                 badge: "bg-green-100 text-green-700" },
};

const statusConfig: Record<POStatus, { label: string; badge: string; icon: React.ReactNode; step: number }> = {
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-600", icon: <FileText className="w-3.5 h-3.5" />, step: 1 },
  sent: { label: "Sent to Supplier", badge: "bg-blue-100 text-blue-700", icon: <Send className="w-3.5 h-3.5" />, step: 2 },
  confirmed: { label: "Confirmed", badge: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" />, step: 3 },
  partially_received: { label: "Partially Received", badge: "bg-amber-100 text-amber-700", icon: <Truck className="w-3.5 h-3.5" />, step: 4 },
  completed: { label: "Completed", badge: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="w-3.5 h-3.5" />, step: 5 },
  cancelled: { label: "Cancelled", badge: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" />, step: 0 },
};

const tabs: { key: POStatus | "all"; label: string }[] = [
  { key: "all", label: "All POs" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "confirmed", label: "Confirmed" },
  { key: "partially_received", label: "Partial Receipt" },
  { key: "completed", label: "Completed" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n}`;
}

const PO_SUPPLIERS = ["Alpha Aggregates", "SteelMart International", "ElectraHub", "PlumbTech Ltd", "DangCem Enterprises", "BuildPlus Supplies", "CemCo Nigeria Ltd"];
const PO_PROJECTS = ["Industrial Warehouse", "Downtown Office Complex", "Riverside Residential", "Highway Interchange", "University Science Block"];
const PO_UNITS = ["Tonnes", "Bags", "Metres", "Sheets", "Rolls", "Units", "Cartons", "Litres"];

interface POItem { material: string; qty: string; unit: string; unitCost: string }

interface CustomTranche {
  title: string;
  percent: string;
  timing: "on_po_approval" | "on_delivery" | "net_30" | "net_60";
}

function NewPOModal({ onClose, onSave, initial }: {
  onClose: () => void;
  onSave: (po: PurchaseOrder, action: "send-to-finance" | "download" | "send" | "draft") => void;
  initial?: PurchaseOrder;
}) {
  const { paymentTerms, signatories, defaultPaymentTermId, addPaymentTerm } = useProcurementSettings();
  const today = new Date();
  const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
  const addDays = (n: number) => { const d2 = new Date(today); d2.setDate(d2.getDate() + n); return fmtDate(d2); };

  const [step, setStep] = useState<1 | 2 | 3>(initial ? 2 : 1);
  const [supplier, setSupplier] = useState(initial?.supplier ?? PO_SUPPLIERS[0]);
  const [supplierContact, setSupplierContact] = useState(initial?.supplierContact ?? "");
  const [prRef, setPrRef] = useState(initial?.prRef ?? "");
  const [project, setProject] = useState(PO_PROJECTS[0]);
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [timingCat, setTimingCat] = useState<"before" | "after" | "both" | "any">("any");
  const [paymentTermId, setPaymentTermId] = useState(defaultPaymentTermId);
  const [customMode, setCustomMode] = useState(false);
  const [commitTermId, setCommitTermId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<{ name: string; description: string; tranches: CustomTranche[] }>({
    name: "", description: "", tranches: [{ title: "", percent: "100", timing: "on_delivery" }],
  });
  const [selectedSignatories, setSelectedSignatories] = useState<string[]>(() =>
    signatories.filter(s => s.role === "Procurement Manager").map(s => s.name),
  );
  const [items, setItems] = useState<POItem[]>(initial
    ? initial.items.map(it => ({ material: it.material, qty: String(it.qty), unit: it.unit, unitCost: String(it.unitCost) }))
    : [{ material: "", qty: "", unit: PO_UNITS[0], unitCost: "" }]);

  const addItem = () => setItems(p => [...p, { material: "", qty: "", unit: PO_UNITS[0], unitCost: "" }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, j) => j !== i));
  const updateItem = (i: number, k: keyof POItem, v: string) => setItems(p => p.map((it, j) => j === i ? { ...it, [k]: v } : it));
  const totalValue = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.unitCost) || 0), 0);
  const { configs } = useNumbering();
  const validSetup = !!supplier && items.every(it => it.material.trim() && it.qty.trim() && it.unitCost.trim());

  // Pure read of the next PO number — getNextId() MUTATES store state, so it
  // must never be called during render (it caused an infinite render loop in
  // the preview). The real counter advances once, at commit time (handleCreate).
  function peekNextId(): string {
    const cfg = configs.find(c => c.module === "PurchaseOrder");
    if (!cfg) return "PO-0001";
    const nextNum = cfg.lastUsedNumber === 0 ? cfg.startingNumber : cfg.lastUsedNumber + cfg.incrementBy;
    return formatId(cfg.template, nextNum);
  }

  const term = paymentTerms.find(t => t.id === paymentTermId) ?? paymentTerms[0];

  // Payment timing buckets — the transaction pays Before Delivery, After
  // Delivery or Both; the term list is filtered to match the choice.
  const hasBefore = (t: PaymentTermPreset) => t.tranches.some(tr => tr.timing === "on_po_approval");
  const hasAfter  = (t: PaymentTermPreset) => t.tranches.some(tr => tr.timing !== "on_po_approval");
  const filteredTerms = paymentTerms.filter(t => {
    if (timingCat === "before") return hasBefore(t) && !hasAfter(t);
    if (timingCat === "after")  return hasAfter(t) && !hasBefore(t);
    if (timingCat === "both")   return hasBefore(t) && hasAfter(t);
    return true;
  });

  const customTotal = customForm.tranches.reduce((s, t) => s + (parseFloat(t.percent) || 0), 0);
  const customValid = !!customForm.name.trim()
    && customForm.tranches.length > 0
    && customForm.tranches.every(t => t.title.trim() && (parseFloat(t.percent) > 0))
    && Math.round(customTotal) === 100;
  const canNext = customMode ? customValid : filteredTerms.length > 0;

  // When the timing bucket changes, keep the selected term valid for that
  // bucket — otherwise the term detail would show a term the filter hides.
  function pickTermForCat(cat: "before" | "after" | "both" | "any") {
    const matches = (t: PaymentTermPreset) => {
      const b = hasBefore(t);
      const a = hasAfter(t);
      if (cat === "before") return b && !a;
      if (cat === "after") return a && !b;
      if (cat === "both") return b && a;
      return true;
    };
    return matches(paymentTerms.find(t => t.id === paymentTermId) ?? paymentTerms[0])
      ? paymentTermId
      : (paymentTerms.find(matches)?.id ?? defaultPaymentTermId);
  }

  const toggleSignatory = (name: string) =>
    setSelectedSignatories(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  function prevStep() {
    setStep(s => (s - 1) as 1 | 2 | 3);
  }

  function continueToPreview() {
    if (customMode && !commitTermId) {
      const termId = `pt-${Date.now()}`;
      addPaymentTerm({
        id: termId,
        name: customForm.name.trim(),
        description: customForm.description.trim(),
        tranches: customForm.tranches.map(t => ({ title: t.title.trim(), percent: parseFloat(t.percent) || 0, timing: t.timing })),
      });
      setCommitTermId(termId);
    }
    setStep(3);
  }

  function buildPO(): PurchaseOrder {
    const nextId = peekNextId();
    return {
      id: nextId, prRef: prRef.trim() || "—", mrRef: "—", supplier,
      supplierContact: supplierContact.trim() || supplier,
      status: "draft", paymentStatus: "unpaid", sentToFinance: false, created: true,
      paymentTermId: customMode ? (commitTermId ?? paymentTermId) : paymentTermId,
      signatories: selectedSignatories,
      createdBy: "Amaka Osei",
      createdDate: fmtDate(today),
      expectedDate: addDays(parseInt(deliveryDays) || 7),
      totalItems: items.length, totalValue, receivedValue: 0,
      items: items.map(it => ({
        material: it.material,
        qty: parseFloat(it.qty) || 0,
        unit: it.unit,
        unitCost: parseFloat(it.unitCost) || 0,
        received: 0,
      })),
    };
  }

  const pendingPO = validSetup ? buildPO() : null;

  // Exiting mid-preview still keeps the PO as a draft — the row then lets you
  // view the attachment or send it to the supplier later.
  function handleClose() {
    if (step === 3 && pendingPO) onSave(pendingPO, "draft");
    else onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create Purchase Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {initial && <span className="text-blue-600">Inherited from {initial.id} · </span>}
              Step {step} of 3 — {step === 1 ? "PO setup" : step === 2 ? "Payment terms & signatories" : "Preview & send"}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {step === 1 && (
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier <span className="text-red-500">*</span></label>
              <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PO_SUPPLIERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Contact</label>
              <input value={supplierContact} onChange={e => setSupplierContact(e.target.value)} placeholder="Name — +234 …"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PR Reference</label>
              <input value={prRef} onChange={e => setPrRef(e.target.value)} placeholder="PR-0019"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project</label>
              <select value={project} onChange={e => setProject(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PO_PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery (days)</label>
              <input type="number" min={1} value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-0.5">Expected: {addDays(parseInt(deliveryDays) || 7)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Line Items <span className="text-red-500">*</span></label>
              <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Line</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_90px_90px_32px] gap-1.5 items-center">
                  <input value={item.material} onChange={e => updateItem(i, "material", e.target.value)} placeholder="Material"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="Qty"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PO_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input type="number" value={item.unitCost} onChange={e => updateItem(i, "unitCost", e.target.value)} placeholder="Unit ₦"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            {totalValue > 0 && (
              <div className="flex justify-end mt-2">
                <span className="text-sm font-semibold text-gray-800">Total: {fmt(totalValue)}</span>
              </div>
            )}
          </div>
        </div>
        )}

        {step === 2 && (
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Payment Timing <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "before", label: "Before Delivery", desc: "Due at PO approval" },
                { key: "after",  label: "After Delivery",  desc: "Due after goods received" },
                { key: "both",   label: "Before & After",  desc: "Split across both" },
              ] as const).map(c => (
                <button key={c.key} onClick={() => { setTimingCat(c.key); setCustomMode(false); setCommitTermId(null); setPaymentTermId(pickTermForCat(c.key)); }}
                  className={`rounded-xl border p-3 text-left transition-colors ${timingCat === c.key ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <p className={`text-sm font-semibold ${timingCat === c.key ? "text-blue-800" : "text-gray-800"}`}>{c.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Payment Terms <span className="text-red-500">*</span></label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={customMode} onChange={e => setCustomMode(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-700 focus:ring-blue-500" />
                Create custom terms
              </label>
            </div>
            {customMode ? (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={customForm.name} onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="Term name e.g. 30% deposit + 70% Net 60"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={customForm.description} onChange={e => setCustomForm({ ...customForm, description: e.target.value })}
                    placeholder="Short description (optional)"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {customForm.tranches.map((tr, i) => (
                  <div key={i} className="grid grid-cols-[1fr_70px_1fr_28px] gap-1.5 items-center">
                    <input value={tr.title} onChange={e => setCustomForm({ ...customForm, tranches: customForm.tranches.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })}
                      placeholder="Tranche title" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="relative">
                      <input type="number" min={0} max={100} value={tr.percent}
                        onChange={e => setCustomForm({ ...customForm, tranches: customForm.tranches.map((x, j) => j === i ? { ...x, percent: e.target.value } : x) })}
                        placeholder="%" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">%</span>
                    </div>
                    <select value={tr.timing} onChange={e => setCustomForm({ ...customForm, tranches: customForm.tranches.map((x, j) => j === i ? { ...x, timing: e.target.value as CustomTranche["timing"] } : x) })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="on_po_approval">Before delivery</option>
                      <option value="on_delivery">On delivery</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_60">Net 60</option>
                    </select>
                    <button disabled={customForm.tranches.length <= 1} onClick={() => setCustomForm({ ...customForm, tranches: customForm.tranches.filter((_, j) => j !== i) })}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <button onClick={() => setCustomForm({ ...customForm, tranches: [...customForm.tranches, { title: "", percent: "", timing: "on_delivery" }] })}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Tranche</button>
                  <p className="text-[11px] text-gray-500">Total: <span className={`font-semibold ${Math.round(customTotal) === 100 ? "text-emerald-600" : "text-amber-600"}`}>{Math.round(customTotal)}%</span></p>
                  {Math.round(customTotal) !== 100 && <p className="text-[11px] text-amber-600">must total 100%</p>}
                </div>
              </div>
            ) : (
              <>
                {filteredTerms.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
                    No preset terms payable entirely {timingCat === "before" ? "before delivery" : timingCat === "after" ? "after delivery" : "this way"} — tick "Create custom terms" to define one.
                  </div>
                ) : (
                  <select value={paymentTermId} onChange={e => setPaymentTermId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {filteredTerms.map(p => <option key={p.id} value={p.id}>{p.name} — {tranchesLabel(p.tranches)}</option>)}
                  </select>
                )}
                {term && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mt-2">
                    <p className="text-xs font-medium text-gray-700">{term.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {term.tranches.map((t, i) => (
                        <span key={i} className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${t.timing === "on_po_approval" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-white text-gray-600 border-gray-200"}`}>
                          {t.percent}% {t.title}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">{term.description}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Signatories on PO</label>
            {signatories.length === 0 ? (
              <p className="text-xs text-gray-400">No signatories configured — add them under Procurement Settings.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {signatories.map(s => {
                  const on = selectedSignatories.includes(s.name);
                  return (
                    <button key={s.id} onClick={() => toggleSignatory(s.name)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${on ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${on ? "text-blue-600" : "text-gray-300"}`} />
                      {s.name} <span className="text-[10px] text-gray-400">· {s.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}

        {step === 3 && pendingPO && (
        <div className="px-6 py-6 bg-gray-50/50">
          <PurchaseOrderPaper po={pendingPO} />
        </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {step === 1 && <p className="text-xs text-gray-400">Fill the PO setup to continue</p>}
            {step !== 1 && <button onClick={prevStep} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Back</button>}
            {step === 3 && (
              <>
                <button onClick={() => pendingPO && onSave(pendingPO, "download")} title="Download PDF"
                  className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><DownloadCloud className="w-5 h-5" /></button>
                <button onClick={() => pendingPO && onSave(pendingPO, "send")} title="Send to supplier"
                  className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Send className="w-5 h-5" /></button>
              </>
            )}
          </div>
          {step === 1 && (
            <button onClick={() => setStep(2)} disabled={!validSetup}
              className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              Continue · Payment Terms <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 2 && (
            <button onClick={continueToPreview} disabled={!canNext}
              className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              Preview PO <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 3 && (
            <button onClick={() => pendingPO && onSave(pendingPO, "send-to-finance")}
              className="px-4 py-2 text-sm bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Send to Finance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SendToSupplierModal({ po, onClose, onDone }: { po: PurchaseOrder; onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Dear ${po.supplier},\n\nPlease find attached Purchase Order ${po.id}. Kindly confirm receipt and expected delivery by ${po.expectedDate}.\n\nRegards,\nProcurement Team`);
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${showPreview ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Send PO to Supplier</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${showPreview ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              <FileText className="w-3.5 h-3.5" /> {showPreview ? "Back to message" : "Preview document"}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
            <span className="font-medium text-blue-800">{po.id}</span> → <span className="text-blue-700">{po.supplier}</span> · {fmt(po.totalValue)}
          </div>
          {showPreview ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">The document below will be attached to the email sent to {po.supplier}.</p>
              <div className="bg-gray-50/60 rounded-xl border border-gray-200 p-4 max-h-[55vh] overflow-y-auto">
                <PurchaseOrderPaper po={po} />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Email <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="procurement@supplier.ng"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onDone} disabled={!email.trim()}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <Send className="w-4 h-4" /> Send PO
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formal PO document ─────────────────────────────────────────────────────
// Viewable/downloadable legal PO rendered as a reusable "paper" (see
// components/PurchaseOrderDocument) shared with the create-PO preview and the
// send-to-supplier preview.
function PurchaseOrderDocumentModal({ po, onClose }: {
  po: PurchaseOrder;
  onClose: () => void;
}) {
  const { getPaymentTerm, signatories, signatoriesFor } = useProcurementSettings();
  const term = getPaymentTerm(po.paymentTermId);
  const poSignatories = po.signatories?.length
    ? signatoriesFor(po.signatories)
    : signatories.filter(s => s.role === "Procurement Manager");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Purchase Order {po.id}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Formal document · {po.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => printPoDocument(po, term, poSignatories)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <DownloadCloud className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 py-6 bg-gray-50/40">
          <PurchaseOrderPaper po={po} />
        </div>
      </div>
    </div>
  );
}

export function PurchaseOrdersPage() {
  const { logChange } = useChangelog();
  const { purchaseOrders: poList, setPurchaseOrders: setPoList } = useProcurement();
  const { getPaymentTerm, signatories, signatoriesFor } = useProcurementSettings();
  const { getNextId } = useNumbering();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<POStatus | "all">("all");
  const [showNewPO, setShowNewPO] = useState(false);
  const [createFrom, setCreateFrom] = useState<PurchaseOrder | null>(null);
  const [sendPO, setSendPO] = useState<PurchaseOrder | null>(null);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  // Creating a PO is term-driven: a term that pays BEFORE delivery routes the
  // PO to Finance (deposit posting); after-delivery terms run through Goods
  // Receipt first and only reach Finance when the GRN hands them over.
  function routeCreated(po: PurchaseOrder): PurchaseOrder {
    const term = getPaymentTerm(po.paymentTermId);
    const hasPreDelivery = term.tranches.some(t => t.timing === "on_po_approval");
    if (hasPreDelivery) {
      const ref = `FIN-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      return { ...po, status: "confirmed" as const, sentToFinance: true, financeRef: ref };
    }
    return { ...po, status: "confirmed" as const };
  }

  function handleCreate(po: PurchaseOrder, action: "send-to-finance" | "download" | "send" | "draft") {
    const sourceId = createFrom?.id ?? null;
    const finalId = getNextId("PurchaseOrder");
    const finalPo = { ...po, id: finalId };
    const save = (next: PurchaseOrder) => {
      setPoList(prev => sourceId ? [next, ...prev.filter(p => p.id !== sourceId)] : [next, ...prev]);
      logChange({ module: "Procurement", action: "Created", entityType: "PurchaseOrder", entityId: next.id, summary: `PO ${next.id} created — ${next.supplier} (${fmt(next.totalValue)})`, performedBy: "Current User" });
      setShowNewPO(false);
      setCreateFrom(null);
      return next;
    };

    if (action === "draft") {
      save(finalPo);
      return;
    }

    const routed = routeCreated(finalPo);
    const term = getPaymentTerm(routed.paymentTermId);
    const hasPreDelivery = term.tranches.some(t => t.timing === "on_po_approval");
    const saved = save(routed);

    if (hasPreDelivery) {
      logChange({ module: "Procurement", action: "Sent to Finance", entityType: "PurchaseOrder", entityId: saved.id, summary: `PO ${saved.id} routed to Finance — ${routed.financeRef} (${term.name})`, performedBy: "Current User" });
    } else {
      logChange({ module: "Procurement", action: "Routed to Goods Receipt", entityType: "PurchaseOrder", entityId: saved.id, summary: `PO ${saved.id} awaits delivery — routes to Goods Receipt (${term.name})`, performedBy: "Current User" });
    }

    if (action === "download") {
      const poSignatories = saved.signatories?.length
        ? signatoriesFor(saved.signatories)
        : signatories.filter(s => s.role === "Procurement Manager");
      printPoDocument(saved, term, poSignatories);
    } else if (action === "send") {
      setSendPO(saved);
    }
  }

  function sendToFinance(po: PurchaseOrder) {
    const ref = `FIN-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setPoList((prev) => prev.map((p) => p.id === po.id ? { ...p, sentToFinance: true, financeRef: ref } : p));
    logChange({ module: "Procurement", action: "Sent to Finance", entityType: "PurchaseOrder", entityId: po.id, summary: `PO ${po.id} sent to finance (${ref})`, performedBy: "Current User" });
  }

  const filtered = poList.filter(po => activeTab === "all" || po.status === activeTab);

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "id",
      label: "PO ID",
      sortable: true,
      filterable: true,
      render: (po) => <span className="font-mono text-xs font-semibold text-gray-900">{po.id}</span>,
    },
    {
      key: "supplier",
      label: "Supplier / Vendor",
      sortable: true,
      filterable: true,
      render: (po) => (
        <div>
          <p className="font-medium text-gray-900">{po.supplier}</p>
          <p className="text-xs text-gray-400">{po.supplierContact}</p>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description / Items",
      sortable: true,
      filterable: true,
      minWidth: 200,
      render: (po) => (
        <div className="text-sm text-gray-600">
          {po.items.length} item{po.items.length > 1 ? "s" : ""}: {po.items.map(it => it.material).join(", ")}
          <p className="text-xs text-gray-400 mt-0.5">Terms: {getPaymentTerm(po.paymentTermId).name}</p>
        </div>
      ),
    },
    {
      key: "totalValue",
      label: "Total ($)",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (po) => <span className="font-semibold text-gray-900">{po.totalValue.toLocaleString()}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (po) => <span className="text-gray-600 text-sm">{po.expectedDate}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (po) => {
        const cfg = statusConfig[po.status];
        return (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}>
            {cfg.icon}{cfg.label}
          </span>
        );
      },
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      sortable: true,
      filterable: true,
      render: (po) => (
        <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_STATUS_CFG[po.paymentStatus].badge}`}>
          {PAYMENT_STATUS_CFG[po.paymentStatus].label}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      render: (po) => {
        if (!po.created) {
          // Not yet a PO — the only action is Create PO.
          return (
            <button onClick={(e) => { e.stopPropagation(); setCreateFrom(po); }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors" title="Create PO from this row (inherits supplier + items)">
              <Plus className="w-3 h-3" /> Create PO
            </button>
          );
        }
        const term = getPaymentTerm(po.paymentTermId);
        const hasPreDelivery = term.tranches.some(t => t.timing === "on_po_approval");
        return (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setViewPO(po); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors" title="View PO document">
              <FileText className="w-3.5 h-3.5" />
            </button>
            {hasPreDelivery ? (
              po.sentToFinance
                ? <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium"><Building2 className="w-3 h-3" /> Sent to Finance</span>
                : <button onClick={(e) => { e.stopPropagation(); sendToFinance(po); }} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"><Building2 className="w-3 h-3" /> Send to Finance</button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); navigate("/apps/procurement/goods-receipt"); }} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors" title="After-delivery term — record delivery on Goods Receipt">
                <Truck className="w-3 h-3" /> Goods Receipt
              </button>
            )}
          </div>
        );
      },
    },
  ];

  function handleExport() {
    const headers = ["PO ID", "PR Ref", "Supplier", "Contact", "Status", "Payment Status", "Total Value", "Expected Date", "Items"];
    const rows = filtered.map(po => [
      po.id, po.prRef, po.supplier, po.supplierContact,
      statusConfig[po.status].label, PAYMENT_STATUS_CFG[po.paymentStatus].label,
      String(po.totalValue), po.expectedDate,
      po.items.map(it => `${it.material} (${it.qty} ${it.unit} @ ₦${it.unitCost})`).join("; "),
    ]);
    exportCSV("purchase-orders", headers, rows);
  }

  const totalValue = poList.filter(po => po.status !== "cancelled").reduce((a, po) => a + po.totalValue, 0);
  const accrualCandidates = poList.filter(po => (po.status === "confirmed" || po.status === "partially_received") && po.paymentStatus !== "paid");
  const totalAccrualExposure = accrualCandidates.reduce((s, po) => s + po.totalValue - po.receivedValue, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage PO lifecycle from draft to completed delivery</p>
        </div>
        <button onClick={() => setShowNewPO(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm hover:bg-blue-800">
          <Plus className="w-3.5 h-3.5" /> Create PO
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total POs", value: poList.length, sub: "All time", color: "bg-gray-50 border-gray-200 text-gray-900" },
          { label: "Open POs", value: poList.filter(p => ["sent", "confirmed", "partially_received"].includes(p.status)).length, sub: "Awaiting delivery", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Total Open Value", value: fmt(totalValue), sub: "Outstanding", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Accrual Exposure", value: fmt(totalAccrualExposure), sub: `${accrualCandidates.length} POs awaiting invoice`, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
          { label: "Completed", value: poList.filter(p => p.status === "completed").length, sub: "This month", color: "bg-green-50 border-green-200 text-green-700" },
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
          const count = tab.key === "all" ? poList.length : poList.filter(po => po.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label} <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <DataTable<PurchaseOrder>
        columns={columns}
        data={filtered}
        keyExtractor={(po) => po.id}
        searchPlaceholder="Search by PO ID, supplier, or material..."
        searchFields={[po => po.id, po => po.supplier, po => po.items.map(i => i.material).join(" ")]}
        headerExtra={
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
            <DownloadCloud className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      />

      {viewPO && (
        <PurchaseOrderDocumentModal po={viewPO} onClose={() => setViewPO(null)} />
      )}
      {showNewPO && (
        <NewPOModal
          onClose={() => setShowNewPO(false)}
          onSave={handleCreate}
        />
      )}
      {createFrom && (
        <NewPOModal
          initial={createFrom}
          onClose={() => setCreateFrom(null)}
          onSave={handleCreate}
        />
      )}
      {sendPO && (
        <SendToSupplierModal
          po={sendPO}
          onClose={() => setSendPO(null)}
          onDone={() => {
            setPoList(prev => prev.map(p => p.id === sendPO.id ? { ...p, status: "sent" as const } : p));
            logChange({ module: "Procurement", action: "Sent", entityType: "PurchaseOrder", entityId: sendPO.id, summary: `PO ${sendPO.id} sent to supplier (${sendPO.supplier})`, performedBy: "Current User" });
            setSendPO(null);
          }}
        />
      )}
    </div>
  );
}
