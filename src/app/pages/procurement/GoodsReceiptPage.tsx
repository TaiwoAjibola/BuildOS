import { useState } from "react";
import {
  PackageCheck, Search, Truck, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight, XCircle, BarChart2, X, Plus, Trash2, LinkIcon, FileText, DownloadCloud,
} from "lucide-react";
import { useNumbering } from "../../stores/numberingStore";
import { useProcurement, type GRN, type GRNStatus } from "../../stores/procurementStore";

const statusConfig: Record<GRNStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Inspection", badge: "bg-amber-100 text-amber-700", icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
  partial: { label: "Partial Delivery", badge: "bg-blue-100 text-blue-700", icon: <Truck className="w-3.5 h-3.5 text-blue-600" /> },
  completed: { label: "Fully Received", badge: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" /> },
  over_supply: { label: "Over Supply", badge: "bg-purple-100 text-purple-700", icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-500" /> },
};

const tabs: { key: GRNStatus | "all"; label: string }[] = [
  { key: "all", label: "All GRNs" },
  { key: "pending", label: "Pending" },
  { key: "partial", label: "Partial" },
  { key: "completed", label: "Completed" },
  { key: "over_supply", label: "Over Supply" },
];

const GRN_WAREHOUSES = ["Main Store", "Electrical Store", "Yard B", "Shed 1", "Timber Yard", "Chemical Store", "Plumbing Store"];
const GRN_PO_REFS = ["PO-0033", "PO-0032", "PO-0031", "PO-0030", "PO-0029", "PO-0028", "PO-0027", "PO-0026", "PO-0025"];
const GRN_UNITS = ["Bags", "Units", "Metres", "Tonnes", "Sheets", "Rolls", "Litres", "Cartons"];

interface GRNItem { material: string; ordered: string; received: string; accepted: string; rejected: string; unit: string; reason: string }

function RecordDeliveryModal({ onClose, onSave, existingGrn }: {
  onClose: () => void;
  onSave: (grn: GRN) => void;
  existingGrn?: GRN;
}) {
  const today = new Date();
  const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const isAdditional = !!existingGrn;

  const [poRef, setPoRef] = useState(existingGrn?.poRef || GRN_PO_REFS[0]);
  const [supplier, setSupplier] = useState(existingGrn?.supplier || "");
  const [warehouse, setWarehouse] = useState(existingGrn?.warehouse || GRN_WAREHOUSES[0]);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [items, setItems] = useState<GRNItem[]>(
    existingGrn
      ? existingGrn.items
          .filter(it => it.received < it.ordered)
          .map(it => ({
            material: it.material,
            ordered: String(it.ordered),
            received: "",
            accepted: "",
            rejected: "0",
            unit: it.unit,
            reason: "",
          }))
      : [{ material: "", ordered: "", received: "", accepted: "", rejected: "0", unit: GRN_UNITS[0], reason: "" }]
  );

  const addItem = () => setItems(p => [...p, { material: "", ordered: "", received: "", accepted: "", rejected: "0", unit: GRN_UNITS[0], reason: "" }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, j) => j !== i));
  const updateItem = (i: number, k: keyof GRNItem, v: string) => setItems(p => p.map((it, j) => j === i ? { ...it, [k]: v } : it));
  const { getNextId } = useNumbering();
  const valid = poRef && deliveryNote.trim() && items.every(it => it.material.trim() && it.received.trim());

  function handleSave() {
    if (!valid) return;
    const nextId = getNextId("GoodsReceipt");
    const builtItems = items.map(it => ({
      material: it.material,
      ordered: parseFloat(it.ordered) || 0,
      received: parseFloat(it.received) || 0,
      accepted: parseFloat(it.accepted || it.received) || 0,
      rejected: parseFloat(it.rejected) || 0,
      unit: it.unit,
      ...(it.reason.trim() ? { reason: it.reason.trim() } : {}),
    }));
    const allComplete = builtItems.every(it => it.received >= it.ordered);
    const hasOver = builtItems.some(it => it.received > it.ordered);
    const status: GRNStatus = hasOver ? "over_supply" : allComplete ? "completed" : "partial";
    onSave({
      id: nextId,
      poRef,
      mrRef: "",
      supplier: supplier.trim() || poRef,
      receivedBy: "Chukwudi Eze",
      receivedDate: fmtDate(today),
      status,
      warehouse,
      deliveryNote: deliveryNote.trim(),
      items: builtItems,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">{isAdditional ? `Additional Delivery — ${existingGrn!.id}` : "Record New Delivery"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Order Ref <span className="text-red-500">*</span></label>
              {isAdditional ? (
                <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">{poRef}</div>
              ) : (
                <select value={poRef} onChange={e => setPoRef(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {GRN_PO_REFS.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Auto-filled from PO"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Note No. <span className="text-red-500">*</span></label>
              <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="DN-XXXX-0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warehouse / Location</label>
              <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {GRN_WAREHOUSES.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Delivery Items <span className="text-red-500">*</span></label>
              {!isAdditional && <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Line</button>}
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left px-3 py-2">Material</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Ordered</th>
                    <th className="px-3 py-2">Received</th>
                    <th className="px-3 py-2">Accepted</th>
                    <th className="px-3 py-2">Rejected</th>
                    <th className="px-3 py-2">Rejection Reason</th>
                    {!isAdditional && <th className="px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        {isAdditional ? (
                          <span className="text-sm font-medium text-gray-800">{item.material}</span>
                        ) : (
                          <input value={item.material} onChange={e => updateItem(i, "material", e.target.value)} placeholder="Material name"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {GRN_UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.ordered} onChange={e => updateItem(i, "ordered", e.target.value)} placeholder="0" readOnly={isAdditional}
                          className={`w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${isAdditional ? "bg-gray-50" : ""}`} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.received} onChange={e => updateItem(i, "received", e.target.value)} placeholder="0"
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.accepted} onChange={e => updateItem(i, "accepted", e.target.value)} placeholder={item.received || "0"}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.rejected} onChange={e => updateItem(i, "rejected", e.target.value)} placeholder="0"
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.reason} onChange={e => updateItem(i, "reason", e.target.value)} placeholder="If any rejections"
                          className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      {!isAdditional && (
                        <td className="px-2 py-1.5">
                          {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!valid}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <PackageCheck className="w-4 h-4" /> Save Delivery Record
          </button>
        </div>
      </div>
    </div>
  );
}

function RaiseRejectionModal({ grn, onClose, onDone }: {
  grn: GRN;
  onClose: () => void;
  onDone: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [returnMethod, setReturnMethod] = useState("Supplier Pickup");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Raise Rejection Note — {grn.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
            <span className="font-medium text-red-800">{grn.id}</span> · <span className="text-red-700">{grn.supplier}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Rejected Items</p>
            {grn.items.filter(it => it.rejected > 0).map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="font-medium text-gray-800">{it.material}</span>
                <span className="text-red-600">{it.rejected} {it.unit}</span>
                {it.reason && <span className="text-gray-400">— {it.reason}</span>}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Return Method</label>
            <select value={returnMethod} onChange={e => setReturnMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {["Supplier Pickup", "Credit Note Requested", "Replacement Requested", "Disposed On-Site"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Additional details about the rejection…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => reason.trim() && onDone(`${returnMethod}: ${reason.trim()}`)} disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Raise Note
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifySupplierModal({ grn, onClose, onDone }: {
  grn: GRN;
  onClose: () => void;
  onDone: () => void;
}) {
  const overItems = grn.items.filter(it => it.received > it.ordered);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Dear ${grn.supplier},\n\nWe received your delivery (${grn.deliveryNote}) and noted the following over-supply:\n\n${overItems.map(it => `• ${it.material}: ordered ${it.ordered}, received ${it.received} ${it.unit} (+${it.received - it.ordered})`).join("\n")}\n\nKindly advise on how you wish to proceed.\n\nRegards,\nProcurement Team`);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Notify Supplier — Over Supply</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm">
            <span className="font-medium text-purple-800">{grn.id}</span> · <span className="text-purple-700">{grn.supplier}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="procurement@supplier.ng"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => email.trim() && onDone()} disabled={!email.trim()}
            className="px-4 py-2 text-sm bg-purple-700 text-white rounded-xl hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formal GRN document ─────────────────────────────────────────────────────
// Goods Received Note as a formal document: company letterhead, linked PO/MR,
// delivery details, line-by-line received/accepted/rejected, signature block.
function GoodsReceiptDocumentModal({ grn, onClose }: {
  grn: GRN;
  onClose: () => void;
}) {
  const cfg = statusConfig[grn.status];

  function downloadPdf() {
    const rows = grn.items.map(it =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${it.material}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.ordered} ${it.unit}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.received}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.accepted}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.rejected}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${it.reason || "—"}</td></tr>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${grn.id}</title></head>
      <body style="font-family:Georgia,serif;color:#111;max-width:720px;margin:32px auto;line-height:1.5">
        <div style="border-bottom:3px double #1e3a8a;padding-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end">
          <div><div style="font-size:22px;font-weight:bold;color:#1e3a8a">BUILDOS CONSTRUCTION</div>
          <div style="font-size:11px;color:#555">Block A, Industrial Estate · Lagos · +234 1 234 5678</div></div>
          <div style="text-align:right"><div style="font-size:16px;font-weight:bold">GOODS RECEIVED NOTE</div>
          <div style="font-size:11px">No: <b>${grn.id}</b></div><div style="font-size:11px">Date: ${grn.receivedDate}</div></div>
        </div>
        <table style="width:100%;margin-top:16px;font-size:13px;border-collapse:collapse">
          <tr>
            <td style="vertical-align:top"><div style="font-weight:bold;border-bottom:1px solid #999;margin-bottom:6px;padding-bottom:2px">Delivery</div>
              <div>Supplier: ${grn.supplier}</div><div style="color:#555;font-size:12px">Delivery Note: ${grn.deliveryNote}</div></td>
            <td style="vertical-align:top"><div style="font-weight:bold;border-bottom:1px solid #999;margin-bottom:6px;padding-bottom:2px">Receipt</div>
              <div>PO: ${grn.poRef}${grn.mrRef ? ` · MR: ${grn.mrRef}` : ""}</div>
              <div style="color:#555;font-size:12px">Received at ${grn.warehouse} by ${grn.receivedBy}</div></td>
          </tr>
        </table>
        <div style="font-weight:bold;border-bottom:1px solid #999;margin:16px 0 6px;padding-bottom:2px">Items</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;border:1px solid #ddd">
          <thead><tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Description</th>
          <th style="padding:6px 8px;text-align:right">Ordered</th><th style="padding:6px 8px;text-align:right">Received</th>
          <th style="padding:6px 8px;text-align:right">Accepted</th><th style="padding:6px 8px;text-align:right">Rejected</th>
          <th style="padding:6px 8px;text-align:left">Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;display:flex;justify-content:space-between;gap:24px;font-size:12px">
          <div style="flex:1"><div style="border-top:1px solid #000;padding-top:4px">Received By<br/>${grn.receivedBy}</div></div>
          <div style="flex:1"><div style="border-top:1px solid #000;padding-top:4px">Stores / QA Check<br/>Name &amp; Signature</div></div>
        </div>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Goods Received Note {grn.id}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Formal document · {grn.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <DownloadCloud className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 py-6 bg-gray-50/40">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Letterhead */}
            <div className="px-6 py-5 border-b-4 border-double border-blue-800 flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-blue-900">BUILDOS CONSTRUCTION</p>
                <p className="text-xs text-gray-500 mt-0.5">Block A, Industrial Estate · Lagos · +234 1 234 5678</p>
                <p className="text-xs text-gray-400">VAT 051-2345-6789 · RCN 2019/0456789</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">GOODS RECEIVED NOTE</p>
                <p className="text-xs text-gray-600 mt-0.5">No: <span className="font-mono font-semibold">{grn.id}</span></p>
                <p className="text-xs text-gray-600">Date: {grn.receivedDate}</p>
              </div>
            </div>

            {/* Delivery + receipt refs */}
            <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Delivery</p>
                <p className="text-sm font-semibold text-gray-900">{grn.supplier}</p>
                <p className="text-xs text-gray-600">Delivery note: {grn.deliveryNote}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Receipt</p>
                <p className="text-sm text-gray-900">PO: <span className="font-mono">{grn.poRef}</span>{grn.mrRef && <span className="text-gray-500"> · MR: <span className="font-mono">{grn.mrRef}</span></span>}</p>
                <p className="text-xs text-gray-600">Received at {grn.warehouse} by {grn.receivedBy}</p>
                <p className="text-xs text-gray-500 mt-0.5">Status: <span className="font-medium">{cfg.label}</span></p>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-2.5 text-left font-semibold">Description</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Ordered</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Received</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Accepted</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Rejected</th>
                  <th className="px-6 py-2.5 text-left font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grn.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-6 py-2.5 text-gray-800">{it.material}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.ordered} {it.unit}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{it.received} {it.unit}</td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-medium">{it.accepted}</td>
                    <td className="px-4 py-2.5 text-right">{it.rejected > 0 ? <span className="text-red-600 font-medium">{it.rejected}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-2.5 text-xs text-gray-400">{it.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature block */}
            <div className="px-6 py-5 border-t border-gray-100 grid grid-cols-2 gap-8">
              <div>
                <div className="h-10 border-b border-gray-900" />
                <p className="text-xs text-gray-700 mt-1.5">Received by</p>
                <p className="text-xs font-semibold text-gray-900">{grn.receivedBy}</p>
              </div>
              <div>
                <div className="h-10 border-b border-gray-900" />
                <p className="text-xs text-gray-700 mt-1.5">Stores / QA inspection</p>
                <p className="text-xs text-gray-600">Name &amp; signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoodsReceiptPage() {
  const { grns: grnList, setGrns: setGrnList } = useProcurement();
  const [activeTab, setActiveTab] = useState<GRNStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewDelivery, setShowNewDelivery] = useState(false);
  const [additionalDelivery, setAdditionalDelivery] = useState<GRN | null>(null);
  const [rejectGrn, setRejectGrn] = useState<GRN | null>(null);
  const [notifyGrn, setNotifyGrn] = useState<GRN | null>(null);
  const [viewGrn, setViewGrn] = useState<GRN | null>(null);

  const filtered = grnList.filter(g => {
    const matchTab = activeTab === "all" || g.status === activeTab;
    const matchSearch = g.id.toLowerCase().includes(search.toLowerCase()) || g.supplier.toLowerCase().includes(search.toLowerCase()) || g.poRef.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Goods Receipt</h1>
          <p className="text-sm text-gray-500 mt-0.5">Receive, inspect, and record deliveries against Purchase Orders</p>
        </div>
        <button onClick={() => setShowNewDelivery(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm hover:bg-blue-800">
          <PackageCheck className="w-3.5 h-3.5" /> Record New Delivery
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total GRNs", value: grnList.length, color: "bg-gray-50 border-gray-200 text-gray-900" },
          { label: "Pending Inspection", value: grnList.filter(g => g.status === "pending").length, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Partial Deliveries", value: grnList.filter(g => g.status === "partial").length, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Completed", value: grnList.filter(g => g.status === "completed").length, color: "bg-green-50 border-green-200 text-green-700" },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-lg border ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => {
          const count = tab.key === "all" ? grnList.length : grnList.filter(g => g.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label} <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search GRNs..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* GRN Cards */}
      <div className="space-y-3">
        {filtered.map(grn => {
          const cfg = statusConfig[grn.status];
          const isExpanded = expanded === grn.id;
          const hasRejections = grn.items.some(i => i.rejected > 0);
          return (
            <div key={grn.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isExpanded ? null : grn.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{grn.id}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">PO: {grn.poRef}</span>
                    {grn.mrRef && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />MR: {grn.mrRef}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}>{cfg.icon}{cfg.label}</span>
                    {hasRejections && <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium"><XCircle className="w-3 h-3" /> Rejections</span>}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">{grn.supplier}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Received by {grn.receivedBy} · {grn.items.length} line item{grn.items.length > 1 ? "s" : ""} · DN: {grn.deliveryNote}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{grn.warehouse}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{grn.receivedDate}</p>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    {[
                      { label: "GRN Number",       value: grn.id },
                      { label: "Purchase Order",   value: grn.poRef },
                      { label: "Material Request", value: grn.mrRef || "—" },
                      { label: "Delivery Note",    value: grn.deliveryNote },
                      { label: "Warehouse",        value: grn.warehouse },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs text-gray-500">{f.label}</p>
                        <p className="font-medium text-gray-900 mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-sm bg-white rounded-md border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                        <th className="px-3 py-2 text-xs font-medium text-gray-500">Material</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Ordered</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Received</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Accepted</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Rejected</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500">Variance</th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grn.items.map((item, i) => {
                        const variance = item.received - item.ordered;
                        return (
                          <tr key={i} className={`hover:bg-gray-50 ${item.rejected > 0 ? "bg-red-50/40" : ""}`}>
                            <td className="px-3 py-2 font-medium text-gray-900">{item.material}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{item.ordered} {item.unit}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">{item.received} {item.unit}</td>
                            <td className="px-3 py-2 text-right text-green-700 font-medium">{item.accepted} {item.unit}</td>
                            <td className="px-3 py-2 text-right">
                              {item.rejected > 0 ? <span className="text-red-600 font-medium">{item.rejected} {item.unit}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-2">
                              {variance === 0 ? <span className="text-gray-400 text-xs">Exact</span>
                                : variance > 0 ? <span className="text-purple-600 text-xs font-medium">+{variance} over</span>
                                : <span className="text-amber-600 text-xs font-medium">{variance} short</span>}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-400">{item.reason || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setViewGrn(grn)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> View Document
                    </button>
                    {grn.status === "pending" && (
                      <>
                        <button onClick={() => setRejectGrn(grn)} className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50">Raise Rejection Note</button>
                        <button onClick={() => setGrnList(prev => prev.map(g => g.id === grn.id ? { ...g, status: "completed" as const } : g))} className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Accept & Update Stock</button>
                      </>
                    )}
                    {grn.status === "partial" && (
                      <button onClick={() => setAdditionalDelivery(grn)} className="px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Record Remaining Delivery</button>
                    )}
                    {grn.status === "over_supply" && (
                      <button onClick={() => setNotifyGrn(grn)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600">Notify Supplier</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNewDelivery && (
        <RecordDeliveryModal
          onClose={() => setShowNewDelivery(false)}
          onSave={(grn) => { setGrnList(prev => [grn, ...prev]); setShowNewDelivery(false); }}
        />
      )}
      {additionalDelivery && (
        <RecordDeliveryModal
          existingGrn={additionalDelivery}
          onClose={() => setAdditionalDelivery(null)}
          onSave={(grn) => { setGrnList(prev => [grn, ...prev]); setAdditionalDelivery(null); }}
        />
      )}
      {rejectGrn && (
        <RaiseRejectionModal
          grn={rejectGrn}
          onClose={() => setRejectGrn(null)}
          onDone={(_reason) => {
            setGrnList(prev => prev.map(g => g.id === rejectGrn.id ? { ...g, status: "completed" as const } : g));
            setRejectGrn(null);
          }}
        />
      )}
      {notifyGrn && (
        <NotifySupplierModal
          grn={notifyGrn}
          onClose={() => setNotifyGrn(null)}
          onDone={() => setNotifyGrn(null)}
        />
      )}
      {viewGrn && (
        <GoodsReceiptDocumentModal grn={viewGrn} onClose={() => setViewGrn(null)} />
      )}
    </div>
  );
}
