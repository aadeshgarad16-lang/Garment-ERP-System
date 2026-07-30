import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { resolveGarmentSleeve } from '@/utils/bomValidation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sizes = searchParams.get('sizes'); 
    const orderQuantity = parseInt(searchParams.get('orderQuantity') || '1', 10);
    const requestedSleeve = searchParams.get('sleeve_type') || searchParams.get('sleeve');

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }

    let resolvedSleeve: string;
    try {
      resolvedSleeve = resolveGarmentSleeve(category, requestedSleeve);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }

    let sizeArray: string[] = [];
    if (sizes) {
      try {
        // Try to parse if it's stringified JSON array
        sizeArray = JSON.parse(sizes);
      } catch (e) {
        // Fallback to comma separated string
        sizeArray = sizes.split(',').map(s => s.trim());
      }
    }

    let query = 'SELECT * FROM garment_bom_table WHERE category = ?';
    const params: any[] = [category];

    if (sizeArray.length > 0) {
      query += ` AND size IN (${sizeArray.map(() => '?').join(',')})`;
      params.push(...sizeArray);
    }

    const [rows] = await pool.query(query, params);
    
    // Process rows to compute final BOM and enforce INR
    const materials = (rows as any[]).map(row => {
      // Safely parse potential numerical fields based on common naming conventions
      const perPieceConsumption = parseFloat(row.consumption_per_piece || row.consumption || row.quantity || '0');
      const unitPrice = parseFloat(row.unit_price || row.price || row.price_per_unit || '0');
      
      let adjustedConsumption = perPieceConsumption;
      // If we need to adjust consumption based on sleeve type:
      // Half sleeves might consume less fabric than full sleeves.
      // This is a placeholder for actual business logic since garment_bom_table
      // may or may not explicitly handle sleeve type variations internally.
      if (row.material_type?.toLowerCase() === 'fabric' || row.item_type?.toLowerCase() === 'fabric') {
         if (resolvedSleeve.toLowerCase() === 'half sleeve') {
            // Apply a default reduction if it's half sleeve, or leave as is if DB handles it.
            // Assuming DB handles it, or we pass `resolvedSleeve` along.
         }
      }

      const totalConsumption = adjustedConsumption * orderQuantity;
      const totalCostINR = totalConsumption * unitPrice;

      return {
        ...row,
        // Enforce computed fields explicitly for INR currency handling
        calculated_consumption: totalConsumption,
        unit_price_inr: unitPrice, 
        total_cost_inr: totalCostINR
      };
    });

    return NextResponse.json({ success: true, materials });

  } catch (error: any) {
    console.error('Error calculating BOM:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
