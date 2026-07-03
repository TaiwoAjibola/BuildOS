import { useState } from "react";
import { Save, Plus, Edit, Trash2, Settings2, Info, CreditCard, Building2, X, CheckCircle, Percent, Palette, Download } from "lucide-react";
import { useFinance } from "../../stores/financeStore";
import { useChangelog } from "../../stores/changelogStore";
import { DataTable, type Column } from "../../components/DataTable";
import { exportCSV } from "../../utils/exportCSV";
import type { AccrualTypeConfig } from "./types";

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  currency: string;
  balance: number;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

const initialBankAccounts: BankAccount[] = [
  { id: "b1", name: "Primary Operations Account", bank: "GTBank", accountNumber: "****8821", currency: "USD", balance: 3834800, isDefault: true },
  { id: "b2", name: "Payroll Account", bank: "Access Bank", accountNumber: "****4432", currency: "USD", balance: 5200000, isDefault: false },
  { id: "b3", name: "Project Reserve Account", bank: "Zenith Bank", accountNumber: "****7715", currency: "USD", balance: 12400000, isDefault: false },
];

const initialPaymentMethods: PaymentMethod[] = [
  { id: "pm1", name: "Bank Transfer", enabled: true },
  { id: "pm2", name: "Cheque", enabled: true },
  { id: "pm3", name: "Mobile Payment", enabled: true },
  { id: "pm4", name: "Credit Card", enabled: false },
  { id: "pm5", name: "Cash", enabled: true },
];

type TaxType = "VAT" | "WHT" | "PAYE" | "Custom";

interface TaxEntry {
  id: string;
  name: string;
  type: TaxType;
  rate: number;
  glCode: string;
  appliesTo: string;
  enabled: boolean;
}

const initialTaxEntries: TaxEntry[] = [
  { id: "t1", name: "VAT (Standard Rate)", type: "VAT", rate: 7.5, glCode: "2300", appliesTo: "Goods & Services", enabled: true },
  { id: "t2", name: "WHT (Contractor)", type: "WHT", rate: 5, glCode: "2310", appliesTo: "Contractor Payments", enabled: true },
  { id: "t3", name: "WHT (Professional Services)", type: "WHT", rate: 10, glCode: "2310", appliesTo: "Professional Fees", enabled: true },
  { id: "t4", name: "PAYE", type: "PAYE", rate: 0, glCode: "2320", appliesTo: "Employee Salaries", enabled: true },
];

const CURRENCIES = ["USD", "NGN", "GBP", "EUR", "GHS", "ZAR"];
const FISCAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const typeColors: Record<TaxType, string> = {
  VAT: "bg-blue-100 text-blue-700",
  WHT: "bg-purple-100 text-purple-700",
  PAYE: "bg-amber-100 text-amber-700",
  Custom: "bg-gray-100 text-gray-600",
};

export function FinanceConfigPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [saved, setSaved] = useState(false);

  // General settings state
  const [currency, setCurrency] = useState("USD");
  const [fiscalYearStart, setFiscalYearStart] = useState("January");
  const [approvalThreshold, setApprovalThreshold] = useState("100000");

  // Bank account modal
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ name: "", bank: "", accountNumber: "", currency: "USD", balance: "" });

  // Tax state
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>(initialTaxEntries);
  const [companyTIN, setCompanyTIN] = useState("12345678-0001");
  const [vatRegNumber, setVatRegNumber] = useState("VAT-NG-00987654");
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxEditId, setTaxEditId] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState<{ name: string; type: TaxType; rate: string; glCode: string; appliesTo: string }>({
    name: "", type: "VAT", rate: "", glCode: "", appliesTo: "",
  });

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  function saveAll() {
    setSaved(true);
    logChange({ module: "Finance", action: "Updated", entityType: "FinanceConfig", entityId: "global", summary: "Finance configuration saved (payment methods, bank accounts, tax entries)", performedBy: "Sola Adeleke" });
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleMethod(id: string) {
    setPaymentMethods((prev) => prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
    const method = paymentMethods.find(m => m.id === id);
    if (method) logChange({ module: "Finance", action: method.enabled ? "Disabled" : "Enabled", entityType: "PaymentMethod", entityId: id, summary: `Payment method "${method.name}" ${method.enabled ? "disabled" : "enabled"}`, performedBy: "Sola Adeleke" });
  }

  function addBankAccount() {
    if (!bankForm.name || !bankForm.bank || !bankForm.accountNumber) return;
    const acc: BankAccount = {
      id: `b${Date.now()}`,
      name: bankForm.name,
      bank: bankForm.bank,
      accountNumber: bankForm.accountNumber,
      currency: bankForm.currency,
      balance: parseFloat(bankForm.balance || "0"),
      isDefault: bankAccounts.length === 0,
    };
    setBankAccounts([...bankAccounts, acc]);
    logChange({ module: "Finance", action: "Created", entityType: "BankAccount", entityId: acc.id, summary: `Bank account "${acc.name}" (${acc.bank}) added`, performedBy: "Sola Adeleke" });
    setShowBankModal(false);
    setBankForm({ name: "", bank: "", accountNumber: "", currency: "USD", balance: "" });
  }

  function setDefault(id: string) {
    setBankAccounts((prev) => prev.map((b) => ({ ...b, isDefault: b.id === id })));
    const acc = bankAccounts.find(b => b.id === id);
    if (acc) logChange({ module: "Finance", action: "Set as Default", entityType: "BankAccount", entityId: id, summary: `Bank account "${acc.name}" set as default`, performedBy: "Sola Adeleke" });
  }

  function toggleTax(id: string) {
    setTaxEntries((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
    const tax = taxEntries.find(t => t.id === id);
    if (tax) logChange({ module: "Finance", action: tax.enabled ? "Disabled" : "Enabled", entityType: "TaxRule", entityId: id, summary: `Tax rule "${tax.name}" ${tax.enabled ? "disabled" : "enabled"}`, performedBy: "Sola Adeleke" });
  }

  function openTaxEdit(t: TaxEntry) {
    setTaxForm({ name: t.name, type: t.type, rate: String(t.rate), glCode: t.glCode, appliesTo: t.appliesTo });
    setTaxEditId(t.id);
    setShowTaxModal(true);
  }

  function openTaxCreate() {
    setTaxForm({ name: "", type: "VAT", rate: "", glCode: "", appliesTo: "" });
    setTaxEditId(null);
    setShowTaxModal(true);
  }

  function saveTax() {
    if (!taxForm.name.trim()) return;
    const entry = { ...taxForm, rate: parseFloat(taxForm.rate || "0"), enabled: true };
    if (taxEditId) {
      setTaxEntries((prev) => prev.map((t) => t.id === taxEditId ? { ...t, ...entry } : t));
      logChange({ module: "Finance", action: "Updated", entityType: "TaxRule", entityId: taxEditId, summary: `Tax rule "${entry.name}" updated`, performedBy: "Sola Adeleke" });
    } else {
      const taxId = `t${Date.now()}`;
      setTaxEntries((prev) => [...prev, { id: taxId, ...entry }]);
      logChange({ module: "Finance", action: "Created", entityType: "TaxRule", entityId: taxId, summary: `Tax rule "${entry.name}" created`, performedBy: "Sola Adeleke" });
    }
    setShowTaxModal(false);
  }

  function handleTaxExport() {
    exportCSV("tax-rules", ["Tax Name", "Type", "Rate", "GL Code", "Applies To", "Active"], taxEntries.map(t => [t.name, t.type, t.type === "PAYE" ? "Variable" : t.rate + "%", t.glCode, t.appliesTo, t.enabled ? "Yes" : "No"]));
  }

  const taxColumns: Column<TaxEntry>[] = [
    { key: "name", label: "Tax Name", sortable: true, filterable: true, render: t => <span className="text-sm font-medium text-gray-900">{t.name}</span> },
    { key: "type", label: "Type", sortable: true, filterable: true, render: t => <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[t.type]}`}>{t.type}</span> },
    { key: "rate", label: "Rate", sortable: true, render: t =>
      t.type === "PAYE" ? <span className="text-xs text-gray-400 italic">Variable</span> : <span className="text-sm font-medium text-gray-900">{t.rate}%</span>
    },
    { key: "glCode", label: "GL Code", sortable: true, filterable: true, render: t => <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t.glCode}</span> },
    { key: "appliesTo", label: "Applies To", sortable: true, filterable: true, render: t => <span className="text-sm text-gray-500">{t.appliesTo}</span> },
    { key: "active", label: "Active", className: "text-center", render: t =>
      <button onClick={() => toggleTax(t.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.enabled ? "bg-emerald-500" : "bg-gray-200"}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${t.enabled ? "translate-x-4.5" : "translate-x-1"}`} />
      </button>
    },
    { key: "actions", label: "Actions", className: "text-right", render: t =>
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => openTaxEdit(t)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setTaxEntries((prev) => prev.filter((x) => x.id !== t.id)); logChange({ module: "Finance", action: "Deleted", entityType: "TaxRule", entityId: t.id, summary: `Tax rule "${t.name}" deleted`, performedBy: "Sola Adeleke" }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    },
  ];

  // ── Accrual Type Config ──────────────────────────────────────────────────
  const { accrualTypeConfigs, setAccrualTypeConfigs } = useFinance();
  const { logChange } = useChangelog();

  const [showAccrualTypeModal, setShowAccrualTypeModal] = useState(false);
  const [accrualTypeEditId, setAccrualTypeEditId] = useState<string | null>(null);
  const [accrualTypeForm, setAccrualTypeForm] = useState({
    type: "", label: "", color: "bg-blue-100 text-blue-700", description: "",
  });

  function openAccrualTypeCreate() {
    setAccrualTypeForm({ type: "", label: "", color: "bg-blue-100 text-blue-700", description: "" });
    setAccrualTypeEditId(null);
    setShowAccrualTypeModal(true);
  }

  function openAccrualTypeEdit(tc: AccrualTypeConfig) {
    setAccrualTypeForm({ type: tc.type, label: tc.label, color: tc.color, description: tc.description });
    setAccrualTypeEditId(tc.id);
    setShowAccrualTypeModal(true);
  }

  function saveAccrualType() {
    if (!accrualTypeForm.type.trim() || !accrualTypeForm.label.trim()) return;
    if (accrualTypeEditId) {
      setAccrualTypeConfigs(prev => prev.map(tc =>
        tc.id === accrualTypeEditId ? { ...tc, ...accrualTypeForm } : tc
      ));
      logChange({ module: "Finance", action: "Updated", entityType: "AccrualTypeConfig", entityId: accrualTypeEditId, summary: `Accrual type "${accrualTypeForm.label}" updated`, performedBy: "Sola Adeleke" });
    } else {
      const atcId = `atc-${Date.now()}`;
      setAccrualTypeConfigs(prev => [...prev, { id: atcId, ...accrualTypeForm }]);
      logChange({ module: "Finance", action: "Created", entityType: "AccrualTypeConfig", entityId: atcId, summary: `Accrual type "${accrualTypeForm.label}" created`, performedBy: "Sola Adeleke" });
    }
    setShowAccrualTypeModal(false);
  }

  function handleAccrualTypeExport() {
    exportCSV("accrual-types", ["Type Key", "Display Label", "Color", "Description"], accrualTypeConfigs.map(tc => [tc.type, tc.label, tc.color, tc.description || ""]));
  }

  const accrualTypeColumns: Column<AccrualTypeConfig>[] = [
    { key: "type", label: "Type Key", sortable: true, filterable: true, render: tc => <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tc.type}</span> },
    { key: "label", label: "Display Label", sortable: true, filterable: true, render: tc => <span className="text-sm font-medium text-gray-900">{tc.label}</span> },
    { key: "color", label: "Color", render: tc => <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${tc.color}`}>{tc.type}</span> },
    { key: "description", label: "Description", sortable: true, filterable: true, render: tc => <span className="text-sm text-gray-500 max-w-xs truncate">{tc.description || "—"}</span> },
    { key: "actions", label: "Actions", className: "text-right", render: tc =>
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => openAccrualTypeEdit(tc)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setAccrualTypeConfigs(prev => prev.filter(x => x.id !== tc.id)); logChange({ module: "Finance", action: "Deleted", entityType: "AccrualTypeConfig", entityId: tc.id, summary: `Accrual type "${tc.label}" deleted`, performedBy: "Sola Adeleke" }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    },
  ];

  const ACCRUAL_TYPE_COLORS = [
    "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700", "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700", "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700",
    "bg-pink-100 text-pink-700",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Finance Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure financial settings, bank accounts, payment methods, and tax rules</p>
        </div>
        <button onClick={saveAll} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${saved ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save All</>}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">These settings control the core behaviour of the Finance module. Changes affect all financial workflows, approvals, and reporting.</p>
      </div>

      {/* General Setup */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">General Setup</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Default Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Financial Year Start</label>
            <select value={fiscalYearStart} onChange={(e) => setFiscalYearStart(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Approval Threshold (USD)</label>
            <input value={approvalThreshold} onChange={(e) => setApprovalThreshold(e.target.value)} placeholder="e.g. 100000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-xs text-gray-400 mt-1">Expenses above this amount require manager approval</p>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Bank Accounts</h2>
          </div>
          <button onClick={() => setShowBankModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {bankAccounts.map((b) => (
            <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    {b.isDefault && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">Default</span>}
                  </div>
                  <p className="text-xs text-gray-500">{b.bank} · {b.accountNumber} · {b.currency}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-900">{fmt(b.balance)}</p>
                {!b.isDefault && (
                  <button onClick={() => setDefault(b.id)} className="text-xs text-emerald-600 hover:underline">Set default</button>
                )}
                <button onClick={() => { setBankAccounts((prev) => prev.filter((x) => x.id !== b.id)); logChange({ module: "Finance", action: "Deleted", entityType: "BankAccount", entityId: b.id, summary: `Bank account "${b.name}" deleted`, performedBy: "Sola Adeleke" }); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Payment Methods</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {paymentMethods.map((m) => (
            <div key={m.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
              </div>
              <button onClick={() => toggleMethod(m.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${m.enabled ? "bg-emerald-500" : "bg-gray-200"}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${m.enabled ? "translate-x-4.5" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Setup */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Tax Setup</h2>
          </div>
          <button onClick={openTaxCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" /> Add Tax Rule
          </button>
        </div>

        {/* Company Tax IDs */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Tax Identification</p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company TIN</label>
              <input value={companyTIN} onChange={(e) => setCompanyTIN(e.target.value)} placeholder="e.g. 12345678-0001" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">VAT Registration Number</label>
              <input value={vatRegNumber} onChange={(e) => setVatRegNumber(e.target.value)} placeholder="e.g. VAT-NG-00987654" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
            </div>
          </div>
        </div>

        {/* Tax Rules Table */}
        <DataTable columns={taxColumns} data={taxEntries} keyExtractor={t => t.id}
          searchPlaceholder="Search tax rules..."
          searchFields={[t => t.name, t => t.type, t => t.glCode, t => t.appliesTo]}
          emptyMessage="No tax rules found"
          headerExtra={<button onClick={handleTaxExport} className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> Export</button>}
        />
      </div>

      {/* Accrual Types */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Accrual Types</h2>
          </div>
          <button onClick={openAccrualTypeCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" /> Add Accrual Type
          </button>
        </div>
        <DataTable columns={accrualTypeColumns} data={accrualTypeConfigs} keyExtractor={tc => tc.id}
          searchPlaceholder="Search accrual types..."
          searchFields={[tc => tc.type, tc => tc.label, tc => tc.description || ""]}
          emptyMessage="No accrual types found"
          headerExtra={<button onClick={handleAccrualTypeExport} className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> Export</button>}
        />
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Add Bank Account</h2>
              <button onClick={() => setShowBankModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Name *</label>
                <input value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} placeholder="e.g. Primary Operations Account" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bank Name *</label>
                  <input value={bankForm.bank} onChange={(e) => setBankForm({ ...bankForm, bank: e.target.value })} placeholder="e.g. GTBank" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Number *</label>
                  <input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="e.g. ****8821" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Currency</label>
                  <select value={bankForm.currency} onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Opening Balance</label>
                  <input value={bankForm.balance} onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })} placeholder="e.g. 1000000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowBankModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addBankAccount} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Add Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Accrual Type Config Modal */}
      {showAccrualTypeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{accrualTypeEditId ? "Edit Accrual Type" : "New Accrual Type"}</h2>
              <button onClick={() => setShowAccrualTypeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type Key *</label>
                  <input value={accrualTypeForm.type} onChange={e => setAccrualTypeForm({ ...accrualTypeForm, type: e.target.value })} placeholder="e.g. goods-received-not-invoiced" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={!!accrualTypeEditId} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Display Label *</label>
                  <input value={accrualTypeForm.label} onChange={e => setAccrualTypeForm({ ...accrualTypeForm, label: e.target.value })} placeholder="e.g. Goods Received Not Invoiced" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCRUAL_TYPE_COLORS.map(c => (
                    <button key={c} onClick={() => setAccrualTypeForm({ ...accrualTypeForm, color: c })}
                      className={`w-7 h-7 rounded-full ${c.replace("text-", "text-white ")} ${accrualTypeForm.color === c ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={accrualTypeForm.description} onChange={e => setAccrualTypeForm({ ...accrualTypeForm, description: e.target.value })} rows={2} placeholder="Describe the purpose of this accrual type" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAccrualTypeModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveAccrualType} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{taxEditId ? "Edit Tax Rule" : "New Tax Rule"}</h2>
              <button onClick={() => setShowTaxModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tax Name *</label>
                <input value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} placeholder="e.g. VAT (Standard Rate)" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tax Type</label>
                  <select value={taxForm.type} onChange={(e) => setTaxForm({ ...taxForm, type: e.target.value as TaxType })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="VAT">VAT</option>
                    <option value="WHT">WHT</option>
                    <option value="PAYE">PAYE</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rate (%)</label>
                  <input value={taxForm.rate} onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })} placeholder="e.g. 7.5" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">GL Code</label>
                  <input value={taxForm.glCode} onChange={(e) => setTaxForm({ ...taxForm, glCode: e.target.value })} placeholder="e.g. 2300" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Applies To</label>
                  <input value={taxForm.appliesTo} onChange={(e) => setTaxForm({ ...taxForm, appliesTo: e.target.value })} placeholder="e.g. Goods & Services" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowTaxModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveTax} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
