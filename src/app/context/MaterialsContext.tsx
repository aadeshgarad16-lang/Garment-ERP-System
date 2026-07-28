import React, { createContext, useContext, useState, useEffect } from 'react';

export interface RawMaterial {
  id: number;
  material: string;
  type: string;
  quantity: string;
  supplier: string;
  status: string;
  unitPrice: number;
}

export interface RecentOrder {
  id: string;
  materialName: string;
  quantity: string;
  status: string; // 'Pending', 'Shipped', 'Delivered'
}

interface MaterialsContextType {
  materials: RawMaterial[];
  archivedMaterials: RawMaterial[];
  recentOrders: RecentOrder[];
  addMaterial: (material: Omit<RawMaterial, 'id'>) => void;
  updateMaterial: (id: number, material: Omit<RawMaterial, 'id'>) => void;
  softDeleteMaterial: (id: number) => void;
  restoreMaterial: (id: number) => void;
  permanentDeleteMaterial: (id: number) => void;
  addRecentOrders: (orders: Omit<RecentOrder, 'id'>[]) => void;
  removeRecentOrder: (id: string) => void;
}

const defaultMaterials: RawMaterial[] = [
  { id: 1,  material: 'Cotton Fabric',            type: 'Fabric',     quantity: '120 meters', supplier: 'ABC Textiles',      status: 'In Stock',     unitPrice: 4.00  },
  { id: 2,  material: 'Polyester Thread',         type: 'Thread',     quantity: '50 spools',  supplier: 'Sewing Co.',        status: 'Low Stock',    unitPrice: 1.50  },
  { id: 3,  material: 'Metal Buttons',            type: 'Buttons',    quantity: '150 pcs',    supplier: 'Fasten Supplies',   status: 'Reorder Soon', unitPrice: 0.15  },
  { id: 4,  material: 'Zippers',                  type: 'Zippers',    quantity: '300 units',  supplier: 'Trim World',        status: 'In Stock',     unitPrice: 0.25  },
  { id: 5,  material: 'Denim Fabric',             type: 'Fabric',     quantity: '85 meters',  supplier: 'Indigo Mills',      status: 'In Stock',     unitPrice: 5.00  },
  { id: 6,  material: 'Silk Fabric',              type: 'Fabric',     quantity: '12 meters',  supplier: 'Royal Silks Ltd.',  status: 'Low Stock',    unitPrice: 12.00 },
  { id: 7,  material: 'Linen Fabric',             type: 'Fabric',     quantity: '0 meters',   supplier: 'EcoWeave Co.',      status: 'Reorder Soon', unitPrice: 7.50  },
  { id: 8,  material: 'Nylon Thread',             type: 'Thread',     quantity: '15 spools',  supplier: 'Sewing Co.',        status: 'Low Stock',    unitPrice: 2.00  },
  { id: 9,  material: 'Elastic Bands (1-inch)',   type: 'Elastics',   quantity: '250 meters', supplier: 'FlexTrim Corp.',    status: 'In Stock',     unitPrice: 0.80  },
  { id: 10, material: 'Wooden Buttons',           type: 'Buttons',    quantity: '18 pcs',     supplier: 'Fasten Supplies',   status: 'Reorder Soon', unitPrice: 0.10  },
  { id: 11, material: 'Hook & Eye Fasteners',     type: 'Fasteners',  quantity: '500 pcs',    supplier: 'Fasten Supplies',   status: 'In Stock',     unitPrice: 0.05  },
  { id: 12, material: 'Velcro Strips',            type: 'Fasteners',  quantity: '8 meters',   supplier: 'Trim World',        status: 'Low Stock',    unitPrice: 1.00  },
  { id: 13, material: 'Clothing Brand Labels',    type: 'Labels',     quantity: '1200 units', supplier: 'TagCraft Print',    status: 'In Stock',     unitPrice: 0.12  },
  { id: 14, material: 'Size Tags (Mixed)',        type: 'Labels',     quantity: '45 units',   supplier: 'TagCraft Print',    status: 'Reorder Soon', unitPrice: 0.05  }
];

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

export const MaterialsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem('erp-active-materials');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return defaultMaterials;
  });

  const [archivedMaterials, setArchivedMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem('erp-archived-materials');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(() => {
    const saved = localStorage.getItem('erp-recent-orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Persist whenever state changes
  useEffect(() => {
    localStorage.setItem('erp-active-materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('erp-archived-materials', JSON.stringify(archivedMaterials));
  }, [archivedMaterials]);

  useEffect(() => {
    localStorage.setItem('erp-recent-orders', JSON.stringify(recentOrders));
  }, [recentOrders]);

  const addMaterial = (newMat: Omit<RawMaterial, 'id'>) => {
    setMaterials(prev => {
      const maxId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) : 0;
      const maxArchivedId = archivedMaterials.length > 0 ? Math.max(...archivedMaterials.map(m => m.id)) : 0;
      return [...prev, { ...newMat, id: Math.max(maxId, maxArchivedId) + 1 }];
    });
  };

  const updateMaterial = (id: number, updatedMat: Omit<RawMaterial, 'id'>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...updatedMat, id } : m));
  };

  const softDeleteMaterial = (id: number) => {
    const itemToArchive = materials.find(m => m.id === id);
    if (itemToArchive) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      setArchivedMaterials(prev => [...prev, itemToArchive]);
    }
  };

  const restoreMaterial = (id: number) => {
    const itemToRestore = archivedMaterials.find(m => m.id === id);
    if (itemToRestore) {
      setArchivedMaterials(prev => prev.filter(m => m.id !== id));
      setMaterials(prev => [...prev, itemToRestore]);
    }
  };

  const permanentDeleteMaterial = (id: number) => {
    setArchivedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addRecentOrders = (orders: Omit<RecentOrder, 'id'>[]) => {
    const newOrders = orders.map((o, index) => ({
      ...o,
      id: `order-${Date.now()}-${index}`
    }));
    setRecentOrders(prev => [...newOrders, ...prev]);
  };

  const removeRecentOrder = (id: string) => {
    setRecentOrders(prev => prev.filter(o => o.id !== id));
  };

  return (
    <MaterialsContext.Provider value={{
      materials,
      archivedMaterials,
      recentOrders,
      addMaterial,
      updateMaterial,
      softDeleteMaterial,
      restoreMaterial,
      permanentDeleteMaterial,
      addRecentOrders,
      removeRecentOrder
    }}>
      {children}
    </MaterialsContext.Provider>
  );
};

export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
};
