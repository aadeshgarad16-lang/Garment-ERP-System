import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPo = searchParams.get('po_number') || searchParams.get('poNumber') || '';
    
    // Strip out customer names or formatting if passed as "PO-123 - Customer"
    let cleanPoNumber = String(rawPo).split(' - ')[0].trim();
    if (cleanPoNumber === 'null' || cleanPoNumber === 'undefined') {
      cleanPoNumber = '';
    }

    if (!cleanPoNumber) {
      return NextResponse.json({ success: true, materials: [] }, { status: 200 });
    }

    // Query bom_done using exact trimmed PO matching
    const [rows]: any = await pool.query(
      `SELECT * FROM bom_done WHERE TRIM(po_number) = TRIM(?)`,
      [cleanPoNumber]
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({ success: true, poNumber: cleanPoNumber, materials: rows }, { status: 200 });
    }

    // FALLBACK: Query order_specifications & bom_master if custom bom_done row is not generated yet
    const [fallbackRows]: any = await pool.query(
      `SELECT 
         os.po_number,
         os.customer_name,
         bm.item_name,
         bm.size,
         bm.per_piece_qty,
         (bm.per_piece_qty * os.total_order_qty) AS total_qty,
         bm.unit_price AS per_unit_price,
         ((bm.per_piece_qty * os.total_order_qty) * bm.unit_price) AS final_price
       FROM order_specifications os
       JOIN bom_master bm ON os.style_id = bm.style_id
       WHERE TRIM(os.po_number) = TRIM(?)`,
      [cleanPoNumber]
    );

    return NextResponse.json({ success: true, poNumber: cleanPoNumber, materials: fallbackRows }, { status: 200 });
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
