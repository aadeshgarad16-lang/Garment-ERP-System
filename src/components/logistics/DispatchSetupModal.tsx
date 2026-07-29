import React, { useState } from 'react';
import { X, Search, CheckCircle2 } from 'lucide-react';

interface DispatchSetupModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function DispatchSetupModal({ onClose, onSubmit }: DispatchSetupModalProps) {
  // Vehicle Selection State
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const standardTransportModes = ['Road Transport', 'Air Freight', 'Express Cargo', 'In-House Vehicle'];

  // Goods Mapping State
  const [goodsQuery, setGoodsQuery] = useState('');
  const [selectedGoods, setSelectedGoods] = useState<string[]>([]);
  const defaultGarmentCategories = ['Mens Shirts', 'Womens Trousers', 'Kids Apparel', 'Jackets/Coats', 'Accessories'];

  const handleAddVehicle = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = vehicleQuery.trim().replace(',', '');
      if (val && !selectedVehicles.includes(val)) {
        setSelectedVehicles([...selectedVehicles, val]);
      }
      setVehicleQuery('');
    }
  };

  const handleRemoveVehicle = (vehicle: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v !== vehicle));
  };

  const toggleVehicleCheckbox = (mode: string) => {
    if (selectedVehicles.includes(mode)) {
      setSelectedVehicles(selectedVehicles.filter(v => v !== mode));
    } else {
      setSelectedVehicles([...selectedVehicles, mode]);
    }
  };

  const handleAddGood = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = goodsQuery.trim().replace(',', '');
      if (val && !selectedGoods.includes(val)) {
        setSelectedGoods([...selectedGoods, val]);
      }
      setGoodsQuery('');
    }
  };

  const handleRemoveGood = (good: string) => {
    setSelectedGoods(selectedGoods.filter(g => g !== good));
  };

  const toggleGoodCheckbox = (category: string) => {
    if (selectedGoods.includes(category)) {
      setSelectedGoods(selectedGoods.filter(g => g !== category));
    } else {
      setSelectedGoods([...selectedGoods, category]);
    }
  };

  const handleFormSubmit = () => {
    onSubmit({
      vehicles: selectedVehicles,
      goods: selectedGoods,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-neutral-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-foreground">Dispatch Goods Setup</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Item & Vehicle Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Item & Vehicle Selection</h3>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search or type custom vehicle / transport tags..."
                  value={vehicleQuery}
                  onChange={(e) => setVehicleQuery(e.target.value)}
                  onKeyDown={handleAddVehicle}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">Press Enter or comma to add a tag.</p>
              </div>
              
              {/* Selected Tags */}
              {selectedVehicles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedVehicles.map(v => (
                    <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                      {v}
                      <button onClick={() => handleRemoveVehicle(v)} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Select Checkboxes */}
              <div className="pt-2">
                <p className="text-xs font-medium text-neutral-500 mb-2">Quick-select transport modes:</p>
                <div className="flex flex-wrap gap-3">
                  {standardTransportModes.map(mode => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.includes(mode)}
                          onChange={() => toggleVehicleCheckbox(mode)}
                          className="peer sr-only"
                        />
                        <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 rounded flex items-center justify-center peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all">
                          <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border"></div>

          {/* Dispatch Destination & Goods Mapping */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Dispatch Destination & Goods Mapping</h3>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search or add finished goods/items to dispatch..."
                  value={goodsQuery}
                  onChange={(e) => setGoodsQuery(e.target.value)}
                  onKeyDown={handleAddGood}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">Press Enter or comma to add a tag.</p>
              </div>
              
              {/* Selected Tags */}
              {selectedGoods.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedGoods.map(g => (
                    <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                      {g}
                      <button onClick={() => handleRemoveGood(g)} className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Select Checkboxes */}
              <div className="pt-2">
                <p className="text-xs font-medium text-neutral-500 mb-2">Quick-select garment categories:</p>
                <div className="flex flex-wrap gap-3">
                  {defaultGarmentCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedGoods.includes(cat)}
                          onChange={() => toggleGoodCheckbox(cat)}
                          className="peer sr-only"
                        />
                        <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 rounded flex items-center justify-center peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all">
                          <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-neutral-50 dark:bg-slate-800/50 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-card border border-border rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={selectedVehicles.length === 0 || selectedGoods.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            Confirm Dispatch Setup
          </button>
        </div>
      </div>
    </div>
  );
}
