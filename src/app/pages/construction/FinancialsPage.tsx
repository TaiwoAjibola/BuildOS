import { useState } from "react";
import { DollarSign, Banknote, Landmark } from "lucide-react";
import { CostsPage } from "./CostsPage";
import { FundingPage } from "./FundingPage";
import { DisbursementsPage } from "./DisbursementsPage";

type FinancialTab = "costs" | "funding" | "disbursements";

const tabs: { id: FinancialTab; label: string; icon: React.ReactNode }[] = [
  { id: "costs", label: "Costs", icon: <DollarSign className="w-4 h-4" /> },
  { id: "funding", label: "Funding", icon: <Banknote className="w-4 h-4" /> },
  { id: "disbursements", label: "Disbursements", icon: <Landmark className="w-4 h-4" /> },
];

export function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<FinancialTab>("costs");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8973A", color: "white" }}>
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Costs, funding allocation, and disbursement tracking</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === "costs" && <CostsPage />}
      {activeTab === "funding" && <FundingPage />}
      {activeTab === "disbursements" && <DisbursementsPage />}
    </div>
  );
}
