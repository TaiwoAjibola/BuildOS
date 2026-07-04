import { Save, Edit, Trash2, Hash, Plus } from "lucide-react";
import { useState } from "react";
import { useNumbering, type ModuleNumbering } from "../../stores/numberingStore";

export function ProcurementConfigPage() {
  const { configs, updateConfig, resetConfig, addConfig, removeConfig } = useNumbering();

  const [editingNumbering, setEditingNumbering] = useState<string | null>(null);
  const [numberingForm, setNumberingForm] = useState<ModuleNumbering | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ModuleNumbering>({ module: "", prefix: "", separator: "-", padLength: 4, nextNumber: 1, description: "" });

  function openNumberingEdit(cfg: ModuleNumbering) {
    setEditingNumbering(cfg.module);
    setNumberingForm({ ...cfg });
  }

  function saveNumbering() {
    if (numberingForm) {
      updateConfig(numberingForm.module, numberingForm);
      setEditingNumbering(null);
      setNumberingForm(null);
    }
  }

  const procurementConfigs = configs.filter(cfg => cfg.module.startsWith("Procurement"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Procurement Configuration</h1>
          </div>
          <p className="text-sm text-gray-500">
            Module-specific configuration for the Procurement module. Access is permission-controlled.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Module Numbering System</h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-4">Configure the auto-numbering format for records across the procurement module. The system uses these patterns when generating new IDs.</p>
          <div className="space-y-3">
            {procurementConfigs.map(cfg => (
              <div key={cfg.module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                {editingNumbering === cfg.module && numberingForm ? (
                  <div className="flex-1 grid grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                      <input value={numberingForm.prefix} onChange={e => setNumberingForm({ ...numberingForm, prefix: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Separator</label>
                      <input value={numberingForm.separator} onChange={e => setNumberingForm({ ...numberingForm, separator: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" maxLength={2} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pad Length</label>
                      <input type="number" value={numberingForm.padLength} onChange={e => setNumberingForm({ ...numberingForm, padLength: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" min={1} max={10} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Next Number</label>
                      <input type="number" value={numberingForm.nextNumber} onChange={e => setNumberingForm({ ...numberingForm, nextNumber: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" min={1} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={saveNumbering} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Save className="w-3 h-3 inline mr-1" />Save</button>
                      <button onClick={() => { setEditingNumbering(null); setNumberingForm(null); }} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium text-gray-900 min-w-[140px]">{cfg.module}</span>
                      <span className="font-mono text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-700">
                        {cfg.prefix}{cfg.separator}{String(cfg.nextNumber).padStart(cfg.padLength, "0")}
                      </span>
                      <span className="text-xs text-gray-400">Next: <strong>{cfg.nextNumber}</strong> &middot; Pad: <strong>{cfg.padLength}</strong></span>
                      <span className="text-xs text-gray-400 ml-2">{cfg.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openNumberingEdit(cfg)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeConfig(cfg.module)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Remove entry"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {showAddForm ? (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="grid grid-cols-6 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Module Name</label>
                    <input value={addForm.module} onChange={e => setAddForm({ ...addForm, module: e.target.value })}
                      placeholder="e.g. ProcurementContract" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <p className="text-[10px] text-gray-400 mt-0.5">Must start with &ldquo;Procurement&rdquo;</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                    <input value={addForm.prefix} onChange={e => setAddForm({ ...addForm, prefix: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Separator</label>
                    <input value={addForm.separator} onChange={e => setAddForm({ ...addForm, separator: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pad Length</label>
                    <input type="number" value={addForm.padLength} onChange={e => setAddForm({ ...addForm, padLength: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" min={1} max={10} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Next Number</label>
                    <input type="number" value={addForm.nextNumber} onChange={e => setAddForm({ ...addForm, nextNumber: parseInt(e.target.value) || 1 })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" min={1} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { addConfig(addForm); setAddForm({ module: "", prefix: "", separator: "-", padLength: 4, nextNumber: 1, description: "" }); setShowAddForm(false); }} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Save className="w-3 h-3 inline mr-1" />Save</button>
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="mt-4 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Numbering Entry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
