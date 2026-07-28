import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { useMaterials, RawMaterial } from '../context/MaterialsContext';
import { TopHeader } from './TopHeader';

export function AddMaterialPage() {
  const navigate = useNavigate();
  const { addMaterial } = useMaterials();
  const [newMat, setNewMat] = useState<Omit<RawMaterial, 'id'>>({ material: '', type: '', quantity: '', supplier: '', status: 'In Stock', unitPrice: 0 });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaterial(newMat);
    navigate('/custom-material', { state: { addedMaterial: newMat.material } });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <TopHeader>
        <button
          onClick={() => navigate('/custom-material')}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors hidden sm:block"
          onClick={() => navigate('/custom-material')}
        >
          Materials
        </span>
        <span className="text-slate-300 dark:text-slate-600 text-sm hidden sm:block">/</span>
        <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add New Material</h1>
      </TopHeader>

      <main className="max-w-3xl mx-auto px-6 mt-8">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Add New Material</h2>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below to add a new raw material to your inventory.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Material Name</label>
              <input 
                required 
                type="text" 
                value={newMat.material} 
                onChange={e => setNewMat({...newMat, material: e.target.value})} 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]" 
                placeholder="e.g. Organic Cotton" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                <input 
                  required 
                  type="text" 
                  value={newMat.type} 
                  onChange={e => setNewMat({...newMat, type: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]" 
                  placeholder="e.g. Fabric" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
                <input 
                  required 
                  type="text" 
                  value={newMat.quantity} 
                  onChange={e => setNewMat({...newMat, quantity: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]" 
                  placeholder="e.g. 50 meters" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Supplier</label>
                <input 
                  required 
                  type="text" 
                  value={newMat.supplier} 
                  onChange={e => setNewMat({...newMat, supplier: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]" 
                  placeholder="e.g. ABC Textiles" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit Price ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={newMat.unitPrice || ''} 
                  onChange={e => setNewMat({...newMat, unitPrice: parseFloat(e.target.value) || 0})} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]" 
                  placeholder="e.g. 5.00" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
              <select 
                value={newMat.status} 
                onChange={e => setNewMat({...newMat, status: e.target.value})} 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1766e6]"
              >
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Reorder Soon">Reorder Soon</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => navigate('/custom-material')} 
                className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1766e6] hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Add Material
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
