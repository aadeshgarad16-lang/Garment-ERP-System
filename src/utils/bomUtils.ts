export interface BOMItemSize {
  size: string;
  qty?: number;
  orderQty?: number;
  quantity?: number;
  garmentQty?: number;
  perPieceQty?: number;
}

export interface BOMItem {
  id?: string;
  name?: string;
  material_name?: string;
  materialName?: string;
  material?: string;
  isApplicable?: boolean;
  totalQty?: number | string;
  totalRequired?: number | string;
  sizes?: BOMItemSize[];
  [key: string]: any;
}

export const getActiveBOMItems = (bomList: BOMItem[]) => {
  return bomList.filter((item) => {
    // Must have a valid specification attachment
    const isConfigured = item.isApplicable !== false;
    
    // Total calculated quantity must be greater than 0
    const totalQty = item.sizes?.reduce((sum, s) => sum + (Number(s.qty || s.orderQty || s.quantity || s.garmentQty || s.perPieceQty) || 0), 0) ?? Number(item.totalQty) ?? 0;

    return isConfigured && totalQty > 0;
  });
};
