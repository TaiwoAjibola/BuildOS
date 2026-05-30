import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Truck, Plus, Search, Filter, Eye, Award, CheckCircle, XCircle, Users, DollarSign, Briefcase } from "lucide-react";
import { getVendorsByProject, getProjectById, fmtCurrency } from "./mockData";
import type { Vendor } from "./types";

const statusStyles: Record<string, { badge: string; label: string }> = {
  Awarded: { badge: "bg-blue-100 text-blue-700", label: "Awarded" },
  Active: { badge: "bg-green-100 text-green-700", label: "Active" },
  Completed: { badge: "bg-gray-100 text-gray-600", label: "Completed" },
  Terminated: { badge: "bg-red-100 text-red-700", label: "Terminated" },
};

const tradeTypes = [
  "Masonry", "Concreting labor", "Carpentry (formwork)", "Carpentry (roofing)",
  "Iron benders / steel fixers", "Tiling", "Plumbing", "Electrical",
  "Painting", "Glazing / aluminum works", "General operations / laboring",
  "Equipment operation",
];

const contractTypes = ["Labor-only", "Supply & Install", "Nominated Subcontractor"];

const emptyVendor = {
  name: "", trade: "", contractType: "Labor-only" as Vendor["contractType"],
  isNominated: false, contractSum: 0, blockAssignment: "",
  skilledCount: 0, unskilledCount: 0, mandaysEstimate: 0,
  status: "Awarded" as Vendor["status"],
};

export function VendorsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = getProjectById(projectId!);
  const vendors = getVendorsByProject(projectId!);

  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [contractFilter, setContractFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyVendor);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = vendors.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tradeFilter !== "All" && v.trade !== tradeFilter) return false;
    if (statusFilter !== "All" && v.status !== statusFilter) return false;
    if (contractFilter !== "All" && v.contractType !== contractFilter) return false;
    return true;
  });

  const trades = [...new Set(vendors.map(v => v.trade))].sort();

  function handleAdd() {
    const newVendor: Vendor = {
      id: `V-${String(vendors.length + 1).padStart(3, "0")}`,
      projectId: projectId!,
      assignedWorkPackages: [],
      ...form,
    };
    vendors.push(newVendor);
    setShowAddModal(false);
    setForm(emptyVendor);
  }

  function contractTypeColor(ct: string) {
    switch (ct) {
      case "Nominated Subcontractor": return "bg-orange-100 text-orange-700";
      case "Supply & Install": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div style={{ backgroundColor: "#F7F8FA" }} className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8973A", color: "white" }}>
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendors</h1>
            <p className="text-sm text-gray-500">{vendors.length} vendors assigned to {project?.name || projectId}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#E8973A" }}
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-600"
          style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg border" style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}>
          <select
            value={tradeFilter}
            onChange={e => setTradeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="All">All Trades</option>
            {trades.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="All">All Statuses</option>
            {Object.keys(statusStyles).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={contractFilter}
            onChange={e => setContractFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
          >
            <option value="All">All Contract Types</option>
            {contractTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(vendor => (
          <div
            key={vendor.id}
            onClick={() => navigate(`/apps/construction/projects/${projectId}/vendors/${vendor.id}`)}
            className="rounded-xl border p-5 cursor-pointer transition-shadow hover:shadow-md"
            style={{ borderColor: "#E2E8F0", backgroundColor: "white" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "#F7F8FA", color: "#E8973A" }}>
                  {vendor.trade}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[vendor.status]?.badge}`}>
                  {statusStyles[vendor.status]?.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${contractTypeColor(vendor.contractType)}`}>
                {vendor.contractType}
              </span>
              {vendor.isNominated && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                  Nominated by House
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3" style={{ color: "#E8973A" }}>
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold text-gray-900">{fmtCurrency(vendor.contractSum)}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{vendor.skilledCount}S / {vendor.unskilledCount}U</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{vendor.blockAssignment}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t flex items-center justify-end" style={{ borderColor: "#E2E8F0" }}>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#E8973A" }}>
                <Eye className="w-3.5 h-3.5" />
                View details
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No vendors found</p>
            <p className="text-sm">Try adjusting your filters or add a new vendor</p>
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E2E8F0" }}>
              <h2 className="text-lg font-bold text-gray-900">Add Vendor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Alhaji Masonry Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                <select
                  value={form.trade}
                  onChange={e => setForm({ ...form, trade: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  <option value="">Select trade</option>
                  {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                <select
                  value={form.contractType}
                  onChange={e => setForm({ ...form, contractType: e.target.value as Vendor["contractType"] })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  {contractTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="isNominated" checked={form.isNominated}
                  onChange={e => setForm({ ...form, isNominated: e.target.checked, contractType: e.target.checked ? "Nominated Subcontractor" : form.contractType })}
                  className="rounded"
                  style={{ accentColor: "#E8973A" }}
                />
                <label htmlFor="isNominated" className="text-sm text-gray-700">Nominated by House</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Sum (₦)</label>
                <input
                  type="number" value={form.contractSum}
                  onChange={e => setForm({ ...form, contractSum: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Assignment</label>
                <input
                  type="text" value={form.blockAssignment}
                  onChange={e => setForm({ ...form, blockAssignment: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  placeholder="e.g. Tower A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skilled Workers</label>
                  <input
                    type="number" value={form.skilledCount}
                    onChange={e => setForm({ ...form, skilledCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unskilled Workers</label>
                  <input
                    type="number" value={form.unskilledCount}
                    onChange={e => setForm({ ...form, unskilledCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Man-days Estimate</label>
                <input
                  type="number" value={form.mandaysEstimate}
                  onChange={e => setForm({ ...form, mandaysEstimate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Vendor["status"] })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F7F8FA" }}
                >
                  {Object.keys(statusStyles).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: "#E2E8F0" }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600"
                style={{ borderColor: "#E2E8F0" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg text-sm text-white font-medium"
                style={{ backgroundColor: "#E8973A" }}
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
