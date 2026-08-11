import { Save, Edit, Trash2, Hash, Plus, X, Star, CreditCard, Signature, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useNumbering, type ModuleNumbering, MODULE_DOMAINS, formatId } from "../../stores/numberingStore";
import { useChangelog } from "../../stores/changelogStore";
import { DataTable, type Column } from "../../components/DataTable";
import { useProcurementSettings, SIGNATORY_ROLES, type Signatory, isPreDelivery, type PaymentTermPreset, type PaymentTranche } from "../../stores/procurementSettingsStore";

const TABS = ["numbering", "payment-terms", "signatories", "approvals", "thresholds"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  numbering: "Numbering",
  "payment-terms": "Payment Terms",
  signatories: "Signatories",
  approvals: "Approvals",
  thresholds: "Thresholds",
};

const TIMING_OPTIONS: PaymentTranche["timing"][] = ["on_po_approval", "on_delivery", "net_30", "net_60"];

const TIMING_LABELS: Record<PaymentTranche["timing"], string> = {
  on_po_approval: "Before delivery (PO approval)",
  on_delivery: "On delivery / GRN",
  net_30: "Net 30 days after delivery",
  net_60: "Net 60 days after delivery",
};

const TRANCH_TIMING_BADGE: Record<PaymentTranche["timing"], string> = {
  on_po_approval: "bg-sky-50 text-sky-700 border-sky-200",
  on_delivery: "bg-emerald-50 text-emerald-700 border-emerald-200",
  net_30: "bg-indigo-50 text-indigo-700 border-indigo-200",
  net_60: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

interface TrancheForm {
  title: string;
  percent: string;
  timing: PaymentTranche["timing"];
}

interface TermForm {
  name: string;
  description: string;
  tranches: TrancheForm[];
}

const BLANK_TERM_FORM = (): TermForm => ({
  name: "",
  description: "",
  tranches: [{ title: "", percent: "100", timing: "on_delivery" }],
});

function percentTotal(tranches: TrancheForm[]): number {
  return tranches.reduce((s, t) => s + (parseFloat(t.percent) || 0), 0);
}

function NumberingPanel() {
  const { configs, updateConfig, resetConfig, addConfig, removeConfig } = useNumbering();
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ template: "", startingNumber: 1, endingNumber: null as number | null, incrementBy: 1 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ module: "", template: "", startingNumber: 1, endingNumber: null as number | null, incrementBy: 1, description: "" });

  function startEdit(cfg: ModuleNumbering) {
    setEditingModule(cfg.module);
    setEditForm({ template: cfg.template, startingNumber: cfg.startingNumber, endingNumber: cfg.endingNumber, incrementBy: cfg.incrementBy });
  }

  function cancelEdit() {
    setEditingModule(null);
  }

  function saveEdit(module: string) {
    updateConfig(module, editForm);
    setEditingModule(null);
  }

  function saveAddNumbering() {
    if (!addFormData.module.trim()) return;
    addConfig({
      module: addFormData.module,
      prefix: addFormData.module.slice(0, 3).toUpperCase(),
      separator: "-",
      template: addFormData.template || `${addFormData.module.slice(0, 3).toUpperCase()}-{N:4}`,
      startingNumber: addFormData.startingNumber,
      endingNumber: addFormData.endingNumber,
      incrementBy: addFormData.incrementBy,
      lastUsedDate: "",
      lastUsedNumber: 0,
      description: addFormData.description,
    });
    setShowAddForm(false);
    setAddFormData({ module: "", template: "", startingNumber: 1, endingNumber: null, incrementBy: 1, description: "" });
  }

  const procurementConfigs = configs.filter(cfg => MODULE_DOMAINS.Procurement.includes(cfg.module));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Hash className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">Module Numbering System</h2>
      </div>
      <div className="p-5">
        <p className="text-xs text-gray-500 mb-4">Configure the auto-numbering format for records across the procurement module. The system uses these patterns when generating new IDs.</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Process</th>
                <th className="px-4 py-3 text-left font-medium">Template</th>
                <th className="px-4 py-3 text-left font-medium">Starting #</th>
                <th className="px-4 py-3 text-left font-medium">Ending #</th>
                <th className="px-4 py-3 text-left font-medium">Increment By</th>
                <th className="px-4 py-3 text-left font-medium">Last Used #</th>
                <th className="px-4 py-3 text-left font-medium">Last Used Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {procurementConfigs.map(cfg => (
                <tr key={cfg.module} className="hover:bg-gray-50 group">
                  {editingModule === cfg.module ? (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{cfg.module}</td>
                      <td className="px-4 py-3">
                        <input type="text" value={editForm.template} onChange={e => setEditForm({ ...editForm, template: e.target.value })}
                          className="w-28 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={1} value={editForm.startingNumber} onChange={e => setEditForm({ ...editForm, startingNumber: parseInt(e.target.value) || 1 })}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input type="number" min={1} value={editForm.endingNumber ?? ""} onChange={e => setEditForm({ ...editForm, endingNumber: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="∞" />
                          <label className="text-[10px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap">
                            <input type="checkbox" checked={editForm.endingNumber === null} onChange={e => setEditForm({ ...editForm, endingNumber: e.target.checked ? null : 9999 })} className="w-3 h-3" />
                            Unlimited
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={1} value={editForm.incrementBy} onChange={e => setEditForm({ ...editForm, incrementBy: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600" title={String(cfg.lastUsedNumber)}>
                          {formatId(cfg.template, cfg.lastUsedNumber)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cfg.lastUsedDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => saveEdit(cfg.module)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{cfg.module}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{cfg.template}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{cfg.startingNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{cfg.endingNumber ?? "∞"}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{cfg.incrementBy}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600" title={String(cfg.lastUsedNumber)}>
                          {formatId(cfg.template, cfg.lastUsedNumber)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cfg.lastUsedDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(cfg)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeConfig(cfg.module)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete entry"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {showAddForm && (
                <tr className="bg-amber-50/50">
                  <td className="px-4 py-3">
                    <select value={addFormData.module} onChange={e => {
                      const m = e.target.value;
                      const prefix = m.slice(0, 3).toUpperCase();
                      setAddFormData({ ...addFormData, module: m, template: m ? `${prefix}-{N:4}` : "" });
                    }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="">Select a process…</option>
                      {MODULE_DOMAINS.Procurement.filter(m => !configs.some(c => c.module === m)).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" value={addFormData.template} onChange={e => setAddFormData({ ...addFormData, template: e.target.value })}
                      className="w-28 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min={1} value={addFormData.startingNumber} onChange={e => setAddFormData({ ...addFormData, startingNumber: parseInt(e.target.value) || 1 })}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input type="number" min={1} value={addFormData.endingNumber ?? ""} onChange={e => setAddFormData({ ...addFormData, endingNumber: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="∞" />
                      <label className="text-[10px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap">
                        <input type="checkbox" checked={addFormData.endingNumber === null} onChange={e => setAddFormData({ ...addFormData, endingNumber: e.target.checked ? null : 9999 })} className="w-3 h-3" />
                        Unlimited
                      </label>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min={1} value={addFormData.incrementBy} onChange={e => setAddFormData({ ...addFormData, incrementBy: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">—</td>
                  <td className="px-4 py-3 text-xs text-gray-400">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={saveAddNumbering} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setShowAddForm(false); setAddFormData({ module: "", template: "", startingNumber: 1, endingNumber: null, incrementBy: 1, description: "" }); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="mt-4 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Numbering Entry
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentTermsPanel() {
  const { paymentTerms, addPaymentTerm, updatePaymentTerm, deletePaymentTerm, defaultPaymentTermId, setDefaultPaymentTermId } = useProcurementSettings();
  const { logChange } = useChangelog();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TermForm>(BLANK_TERM_FORM());

  function openCreate() {
    setForm(BLANK_TERM_FORM());
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(t: PaymentTermPreset) {
    setForm({
      name: t.name,
      description: t.description,
      tranches: t.tranches.map(tr => ({ title: tr.title, percent: String(tr.percent), timing: tr.timing })),
    });
    setEditId(t.id);
    setShowModal(true);
  }

  function saveTerm() {
    if (editId) {
      updatePaymentTerm(editId, {
        name: form.name.trim(),
        description: form.description.trim(),
        tranches: form.tranches.map(tr => ({ title: tr.title.trim(), percent: parseFloat(tr.percent) || 0, timing: tr.timing })),
      });
      logChange({ module: "Procurement", action: "Updated", entityType: "PaymentTerm", entityId: editId, summary: `Payment term "${form.name.trim()}" updated`, performedBy: "Current User" });
    } else {
      const termId = `pt-${Date.now()}`;
      addPaymentTerm({
        id: termId,
        name: form.name.trim(),
        description: form.description.trim(),
        tranches: form.tranches.map(tr => ({ title: tr.title.trim(), percent: parseFloat(tr.percent) || 0, timing: tr.timing })),
      });
      logChange({ module: "Procurement", action: "Created", entityType: "PaymentTerm", entityId: termId, summary: `Payment term "${form.name.trim()}" created (${form.tranches.length} tranche${form.tranches.length !== 1 ? "s" : ""})`, performedBy: "Current User" });
    }
    setShowModal(false);
  }

  function setDefault(id: string) {
    setDefaultPaymentTermId(id);
    const t = paymentTerms.find(x => x.id === id);
    if (t) logChange({ module: "Procurement", action: "Set as Default", entityType: "PaymentTerm", entityId: id, summary: `Payment term "${t.name}" set as default for new purchase orders`, performedBy: "Current User" });
  }

  const columns: Column<PaymentTermPreset>[] = [
    { key: "name", label: "Term", sortable: true, filterable: true, render: t => (
      <span className="inline-flex items-center gap-2">
        <span className="font-medium text-gray-900">{t.name}</span>
        {t.id === defaultPaymentTermId && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-semibold">Default</span>}
      </span>
    )},
    { key: "description", label: "Description", sortable: true, filterable: true, render: t => <span className="text-sm text-gray-500 max-w-xs truncate">{t.description}</span> },
    { key: "tranches", label: "Payment Structure", sortable: false, filterable: false, render: t => (
      <div className="flex flex-wrap gap-1">
        {t.tranches.map((tr, i) => (
          <span key={i} className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${TRANCH_TIMING_BADGE[tr.timing]}`}>
            {tr.percent}% {tr.title}
          </span>
        ))}
      </div>
    )},
    { key: "delivery", label: "Delivery Split", sortable: true, filterable: false, render: t => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${isPreDelivery(t) ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
        {isPreDelivery(t) ? "Pre-delivery payment" : "Paid after delivery"}
      </span>
    )},
    { key: "actions", label: "Actions", className: "text-right", sortable: false, filterable: false, render: t => (
      <div className="flex items-center justify-end gap-1">
        {t.id !== defaultPaymentTermId && (
          <button onClick={() => setDefault(t.id)} title="Set as default" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Star className="w-3.5 h-3.5" /></button>
        )}
        <button onClick={() => openEdit(t)} title="Edit term" className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => { deletePaymentTerm(t.id); logChange({ module: "Procurement", action: "Deleted", entityType: "PaymentTerm", entityId: t.id, summary: `Payment term "${t.name}" deleted`, performedBy: "Current User" }); }} title="Delete term" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Payment Terms</h2>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" /> Add Payment Term
          </button>
        </div>
        <DataTable columns={columns} data={paymentTerms} keyExtractor={t => t.id}
          searchPlaceholder="Search payment terms..." searchFields={[t => t.name, t => t.description, t => t.tranches.map(tr => tr.title).join(" ")]}
          emptyMessage="No payment terms configured." />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{editId ? "Edit Payment Term" : "New Payment Term"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Term Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 30% deposit + 70% Net 60"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Explain the payment structure"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tranches</p>
                  <button onClick={() => setForm({ ...form, tranches: [...form.tranches, { title: "", percent: "", timing: "on_delivery" }] })}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800">
                    <Plus className="w-3.5 h-3.5" /> Add Tranche
                  </button>
                </div>
                <div className="space-y-2 p-3">
                  {form.tranches.map((tr, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_1fr_32px] gap-2 items-center">
                      <input value={tr.title} onChange={e => setForm({ ...form, tranches: form.tranches.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })}
                        placeholder="Tranche title e.g. Deposit" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="relative">
                        <input type="number" min={0} max={100} value={tr.percent}
                          onChange={e => setForm({ ...form, tranches: form.tranches.map((x, j) => j === i ? { ...x, percent: e.target.value } : x) })}
                          placeholder="%" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                      <select value={tr.timing} onChange={e => setForm({ ...form, tranches: form.tranches.map((x, j) => j === i ? { ...x, timing: e.target.value as PaymentTranche["timing"] } : x) })}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {TIMING_OPTIONS.map(t => <option key={t} value={t}>{TIMING_LABELS[t]}</option>)}
                      </select>
                      <button disabled={form.tranches.length <= 1} onClick={() => setForm({ ...form, tranches: form.tranches.filter((_, j) => j !== i) })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="px-4 pt-2 pb-3 flex items-center gap-3">
                  <p className="text-xs text-gray-500">Total: <span className={`font-semibold ${Math.round(percentTotal(form.tranches)) === 100 ? "text-emerald-600" : "text-amber-600"}`}>{Math.round(percentTotal(form.tranches))}%</span></p>
                  {Math.round(percentTotal(form.tranches)) !== 100 && (
                    <p className="text-xs text-amber-600">Tranches must total 100% to be a valid payment structure.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveTerm} disabled={!form.name.trim() || form.tranches.length === 0 || form.tranches.some(t => !t.title.trim() || !(parseFloat(t.percent) > 0)) || Math.round(percentTotal(form.tranches)) !== 100}
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed">Save Payment Term</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignatoriesPanel() {
  const { signatories, addSignatory, updateSignatory, deleteSignatory } = useProcurementSettings();
  const { logChange } = useChangelog();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; role: string; department: string }>({ name: "", role: SIGNATORY_ROLES[0], department: "" });

  function openCreate() {
    setForm({ name: "", role: SIGNATORY_ROLES[0], department: "" });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(s: Signatory) {
    setForm({ name: s.name, role: s.role, department: s.department ?? "" });
    setEditId(s.id);
    setShowModal(true);
  }

  function saveSignatory() {
    if (editId) {
      updateSignatory(editId, { name: form.name.trim(), role: form.role, department: form.department.trim() || undefined });
      logChange({ module: "Procurement", action: "Updated", entityType: "Signatory", entityId: editId, summary: `PO signatory "${form.name.trim()}" updated (${form.role})`, performedBy: "Current User" });
    } else {
      const sigId = `sig-${Date.now()}`;
      addSignatory({ id: sigId, name: form.name.trim(), role: form.role, department: form.department.trim() || undefined });
      logChange({ module: "Procurement", action: "Created", entityType: "Signatory", entityId: sigId, summary: `PO signatory "${form.name.trim()}" added (${form.role})`, performedBy: "Current User" });
    }
    setShowModal(false);
  }

  const columns: Column<Signatory>[] = [
    { key: "name", label: "Name", sortable: true, filterable: true, render: s => <span className="font-medium text-gray-900">{s.name}</span> },
    { key: "role", label: "Role", sortable: true, filterable: true, render: s => <span className="text-sm text-gray-600">{s.role}</span> },
    { key: "department", label: "Department", sortable: true, filterable: true, render: s => <span className="text-sm text-gray-500">{s.department || "—"}</span> },
    { key: "actions", label: "Actions", className: "text-right", sortable: false, filterable: false, render: s => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => openEdit(s)} title="Edit signatory" className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => { deleteSignatory(s.id); logChange({ module: "Procurement", action: "Deleted", entityType: "Signatory", entityId: s.id, summary: `PO signatory "${s.name}" removed`, performedBy: "Current User" }); }} title="Remove signatory" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Signature className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">PO Signatories</h2>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" /> Add Signatory
          </button>
        </div>
        <DataTable columns={columns} data={signatories} keyExtractor={s => s.id}
          searchPlaceholder="Search signatories..." searchFields={[s => s.name, s => s.role, s => s.department || ""]}
          emptyMessage="No signatories configured." />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{editId ? "Edit Signatory" : "New Signatory"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Amaka Osei"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SIGNATORY_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Procurement"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveSignatory} disabled={!form.name.trim()}
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed">Save Signatory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalsPanel() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <SettingsIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Approval workflow configuration coming soon.</p>
    </div>
  );
}

function ThresholdsPanel() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <SettingsIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Procurement thresholds configuration coming soon.</p>
    </div>
  );
}

export function ProcurementSettingsPage() {
  const [tab, setTab] = useState<Tab>("numbering");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Procurement Settings</h1>
          </div>
          <p className="text-sm text-gray-500">Module-specific configuration for the Procurement module. Access is permission-controlled.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "numbering" && <NumberingPanel />}
      {tab === "payment-terms" && <PaymentTermsPanel />}
      {tab === "signatories" && <SignatoriesPanel />}
      {tab === "approvals" && <ApprovalsPanel />}
      {tab === "thresholds" && <ThresholdsPanel />}
    </div>
  );
}
