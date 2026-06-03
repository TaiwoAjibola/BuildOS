import { useState } from "react";
import { Wallet, DollarSign, Landmark, PiggyBank } from "lucide-react";
import { CostsOverviewPage } from "./CostsOverviewPage";
import { FundingPage } from "./FundingPage";
import { DisbursementsPage } from "./DisbursementsPage";

type FinanceTab = "costs" | "funding" | "disbursements";

const tabs: { key: FinanceTab; label: string; icon: React.ReactNode }[] = [
  { key: "costs", label: "Costing", icon: <DollarSign className="w-4 h-4" /> },
  { key: "funding", label: "Funding", icon: <Landmark className="w-4 h-4" /> },
  { key: "disbursements", label: "Disbursement", icon: <PiggyBank className="w-4 h-4" /> },
];

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("costs");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8973A", color: "white" }}>
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Costing, funding, and disbursement management</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-md">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "costs" && <CostsOverviewPage />}
      {activeTab === "funding" && <FundingPage />}
      {activeTab === "disbursements" && <DisbursementsPage />}
    </div>
  );
}
