import React, { createContext, useContext, useState, useEffect } from 'react';
import { Garment, defaultPrestitchedGarments } from '../components/garmentsData';


interface GarmentsContextType {
  garments: Garment[];
  archivedGarments: Garment[];
  addGarment: (garment: Garment) => void;
  updateGarment: (id: number, garment: Partial<Garment>) => void;
  softDeleteGarment: (id: number) => void;
  restoreGarment: (id: number) => void;
  permanentDeleteGarment: (id: number) => void;
}

const GarmentsContext = createContext<GarmentsContextType | undefined>(undefined);

export function GarmentsProvider({ children }: { children: React.ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>(() => {
    const migrateGarment = (items: any[]) => items.map(item => {
      let migratedItem = { ...item };
      if (migratedItem.price === undefined) {
        const defaultItem = defaultPrestitchedGarments.find(d => d.id === migratedItem.id);
        migratedItem.price = defaultItem?.price || 499;
      }
      if (migratedItem.status === 'Sold Out') {
        migratedItem.status = 'Out of Stock';
      }
      return migratedItem;
    });

    const saved = localStorage.getItem('erp-active-garments');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (parsed && Array.isArray(parsed)) return migrateGarment(parsed);
      } catch (e) { /* ignore */ }
    }
    // Migrate old data if present
    const oldSaved = localStorage.getItem('prestitched-garments');
    if (oldSaved) {
      try { 
        const parsed = JSON.parse(oldSaved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) return migrateGarment(parsed);
      } catch (e) { /* ignore */ }
    }
    return defaultPrestitchedGarments;
  });

  const [archivedGarments, setArchivedGarments] = useState<Garment[]>(() => {
    const saved = localStorage.getItem('erp-archived-garments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });



  // Persist whenever state changes
  useEffect(() => {
    localStorage.setItem('erp-active-garments', JSON.stringify(garments));
  }, [garments]);

  useEffect(() => {
    localStorage.setItem('erp-archived-garments', JSON.stringify(archivedGarments));
  }, [archivedGarments]);



  const addGarment = (newGarment: Garment) => {
    setGarments(prev => {
      // Ensure unique ID if not properly assigned
      const isUnique = !prev.some(g => g.id === newGarment.id);
      if (!isUnique) {
        const maxId = prev.length > 0 ? Math.max(...prev.map(g => g.id)) : 0;
        newGarment.id = maxId + 1;
      }
      return [newGarment, ...prev];
    });
  };

  const updateGarment = (id: number, updatedFields: Partial<Garment>) => {
    setGarments(prev => prev.map(g => (g.id === id ? { ...g, ...updatedFields } : g)));
  };

  const softDeleteGarment = (id: number) => {
    const itemToArchive = garments.find(g => g.id === id);
    if (itemToArchive) {
      setArchivedGarments(prev => [itemToArchive, ...prev]);
      setGarments(prev => prev.filter(g => g.id !== id));
    }
  };

  const restoreGarment = (id: number) => {
    const itemToRestore = archivedGarments.find(g => g.id === id);
    if (itemToRestore) {
      setGarments(prev => [itemToRestore, ...prev]);
      setArchivedGarments(prev => prev.filter(g => g.id !== id));
    }
  };

  const permanentDeleteGarment = (id: number) => {
    setArchivedGarments(prev => prev.filter(g => g.id !== id));
  };



  return (
    <GarmentsContext.Provider value={{
      garments,
      archivedGarments,
      addGarment,
      updateGarment,
      softDeleteGarment,
      restoreGarment,
      permanentDeleteGarment
    }}>
      {children}
    </GarmentsContext.Provider>
  );
}

export function useGarments() {
  const context = useContext(GarmentsContext);
  if (context === undefined) {
    throw new Error('useGarments must be used within a GarmentsProvider');
  }
  return context;
}
