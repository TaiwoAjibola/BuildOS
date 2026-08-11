import { useProcurementSettings, type PaymentTermPreset, type Signatory } from "../stores/procurementSettingsStore";
import type { PurchaseOrder } from "../stores/procurementStore";

// ── Formal Purchase Order document ────────────────────────────────────────
// Reusable "paper": company letterhead, supplier + delivery details, line
// items, payment terms and the signature block. Rendered by the standalone
// PO document modal, the create-PO preview step and the send-to-supplier
// preview. printPoDocument() opens a print-ready copy (Download PDF).

export function PurchaseOrderPaper({ po }: { po: PurchaseOrder }) {
  const { getPaymentTerm, signatories, signatoriesFor } = useProcurementSettings();
  const term = getPaymentTerm(po.paymentTermId);
  const poSignatories = po.signatories?.length
    ? signatoriesFor(po.signatories)
    : signatories.filter(s => s.role === "Procurement Manager");

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Letterhead */}
      <div className="px-6 py-5 border-b-4 border-double border-blue-800 flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-blue-900">BUILDOS CONSTRUCTION</p>
          <p className="text-xs text-gray-500 mt-0.5">Block A, Industrial Estate · Lagos · +234 1 234 5678</p>
          <p className="text-xs text-gray-400">VAT 051-2345-6789 · RCN 2019/0456789</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">PURCHASE ORDER</p>
          <p className="text-xs text-gray-600 mt-0.5">No: <span className="font-mono font-semibold">{po.id}</span></p>
          <p className="text-xs text-gray-600">Date: {po.createdDate}</p>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Bill To / Supplier</p>
          <p className="text-sm font-semibold text-gray-900">{po.supplier}</p>
          <p className="text-xs text-gray-600">{po.supplierContact}</p>
          <p className="text-xs text-gray-500 mt-1">Payment ref: <span className="font-mono">{po.id}</span></p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Ship To</p>
          <p className="text-sm text-gray-900">Site Stores — Main Yard</p>
          <p className="text-xs text-gray-600">Lagos, Nigeria</p>
          <p className="text-xs text-gray-500 mt-1">Expected delivery: {po.expectedDate}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-6 py-2.5 text-left font-semibold">Description</th>
            <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
            <th className="px-4 py-2.5 text-right font-semibold">Unit Price</th>
            <th className="px-6 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {po.items.map((it, i) => (
            <tr key={i}>
              <td className="px-6 py-2.5 text-gray-800">{it.material}</td>
              <td className="px-4 py-2.5 text-right text-gray-700">{it.qty.toLocaleString()} {it.unit}</td>
              <td className="px-4 py-2.5 text-right text-gray-700">₦{it.unitCost.toLocaleString()}</td>
              <td className="px-6 py-2.5 text-right font-medium text-gray-900">₦{(it.qty * it.unitCost).toLocaleString()}</td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">TOTAL</td>
            <td className="px-6 py-3 text-right font-bold text-gray-900">₦{po.totalValue.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Payment terms */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">Payment Terms</p>
        <p className="text-sm text-gray-800 font-medium">{term.name}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {term.tranches.map((t, i) => (
            <span key={i} className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${t.timing === "on_po_approval" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-white text-gray-600 border-gray-200"}`}>
              {t.percent}% {t.title}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{term.description}</p>
      </div>

      {/* Signature block */}
      <div className="px-6 py-5 border-t border-gray-100 grid grid-cols-2 gap-8">
        <div>
          <div className="space-y-3">
            {poSignatories.map(s => (
              <div key={s.name}>
                <div className="h-9 border-b border-gray-900" />
                <p className="text-xs font-semibold text-gray-900 mt-1">{s.name}</p>
                <p className="text-[11px] text-gray-500">{s.role}</p>
              </div>
            ))}
            {poSignatories.length === 0 && (
              <>
                <div className="h-9 border-b border-gray-900" />
                <p className="text-xs font-semibold text-gray-900 mt-1">Procurement Manager</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-700 mt-3 font-medium">Authorised for BUILDOS</p>
        </div>
        <div>
          <div className="h-10 border-b border-gray-900" />
          <p className="text-xs text-gray-700 mt-1.5">Supplier acknowledgement</p>
          <p className="text-xs text-gray-600">Name &amp; signature</p>
        </div>
      </div>
    </div>
  );
}

/** Opens a print-ready (PDF) copy of the formal PO. */
export function printPoDocument(po: PurchaseOrder, term: PaymentTermPreset, poSignatories: Signatory[]) {
  const rows = po.items.map(it =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${it.material}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.qty.toLocaleString()} ${it.unit}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₦${it.unitCost.toLocaleString()}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₦${(it.qty * it.unitCost).toLocaleString()}</td></tr>`).join("");
  const tranches = term.tranches.map(t => `${t.percent}% ${t.title}`).join(" + ");
  const sigHtml = poSignatories.map(s =>
    `<div style="margin-bottom:10px"><div style="border-top:1px solid #000;padding-top:4px">${s.name}<br/><span style="color:#555;font-size:11px">${s.role}</span></div></div>`
  ).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${po.id}</title></head>
    <body style="font-family:Georgia,serif;color:#111;max-width:720px;margin:32px auto;line-height:1.5">
      <div style="border-bottom:3px double #1e3a8a;padding-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end">
        <div><div style="font-size:22px;font-weight:bold;color:#1e3a8a">BUILDOS CONSTRUCTION</div>
        <div style="font-size:11px;color:#555">Block A, Industrial Estate · Lagos · +234 1 234 5678</div></div>
        <div style="text-align:right"><div style="font-size:16px;font-weight:bold">PURCHASE ORDER</div>
        <div style="font-size:11px">No: <b>${po.id}</b></div><div style="font-size:11px">Date: ${po.createdDate}</div></div>
      </div>
      <table style="width:100%;margin-top:16px;font-size:13px;border-collapse:collapse">
        <tr>
          <td style="vertical-align:top"><div style="font-weight:bold;border-bottom:1px solid #999;margin-bottom:6px;padding-bottom:2px">Supplier</div>
            <div>${po.supplier}</div><div style="color:#555;font-size:12px">${po.supplierContact}</div></td>
          <td style="vertical-align:top"><div style="font-weight:bold;border-bottom:1px solid #999;margin-bottom:6px;padding-bottom:2px">Deliver To</div>
            <div>Site Stores — Main Yard</div><div style="color:#555;font-size:12px">Lagos, Nigeria</div>
            <div style="color:#555;font-size:12px">Expected: ${po.expectedDate}</div></td>
        </tr>
      </table>
      <div style="font-weight:bold;border-bottom:1px solid #999;margin:16px 0 6px;padding-bottom:2px">Items</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;border:1px solid #ddd">
        <thead><tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Description</th>
        <th style="padding:6px 8px;text-align:right">Qty</th><th style="padding:6px 8px;text-align:right">Unit Price</th>
        <th style="padding:6px 8px;text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold">TOTAL</td>
        <td style="padding:8px;text-align:right;font-weight:bold">₦${po.totalValue.toLocaleString()}</td></tr></tfoot>
      </table>
      <div style="font-weight:bold;border-bottom:1px solid #999;margin:16px 0 6px;padding-bottom:2px">Payment Terms</div>
      <div style="font-size:12px">${term.name} — ${tranches}</div>
      <div style="font-size:11px;color:#555;margin-top:2px">${term.description}</div>
      <div style="margin-top:24px;display:flex;justify-content:space-between;gap:24px;font-size:12px">
        <div style="flex:1">${sigHtml}<div style="margin-top:4px;font-weight:bold">Authorised for BUILDOS</div></div>
        <div style="flex:1"><div style="border-top:1px solid #000;padding-top:4px">Supplier Acknowledgement<br/>Name &amp; Signature</div></div>
      </div>
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}