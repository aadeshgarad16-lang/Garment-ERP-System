import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export function usePOWorkflow<T>(fetchDataApi: (poNumber: string) => Promise<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract PO from query string (handles 'po_number', 'po_id', or 'po')
  const urlPO = searchParams.get('po_number') || searchParams.get('po_id') || searchParams.get('po') || searchParams.get('poNumber') || '';
  const [selectedPO, setSelectedPO] = useState<string>(urlPO);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadPOData = useCallback(async (poNumber: string) => {
    if (!poNumber) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchDataApi(poNumber);
      setData(result);
    } catch (error) {
      console.error(`Failed to load workflow data for PO ${poNumber}:`, error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchDataApi]);

  // Auto-hydrate when URL parameter changes or page loads
  useEffect(() => {
    if (urlPO) {
      setSelectedPO(urlPO);
      loadPOData(urlPO);
    }
  }, [urlPO, loadPOData]);

  // Change PO handler (updates UI state AND URL query string synchronously)
  const changePO = (newPO: string) => {
    setSelectedPO(newPO);
    if (newPO) {
      router.replace(`${pathname}?po_number=${encodeURIComponent(newPO)}`, { scroll: false });
      loadPOData(newPO);
    } else {
      router.replace(pathname, { scroll: false });
      setData(null);
    }
  };

  return { selectedPO, changePO, data, setData, loading, reload: () => loadPOData(selectedPO) };
}
