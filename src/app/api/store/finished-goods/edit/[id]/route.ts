import { NextResponse } from 'next/server';

import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { skuNo, hsnCode, description, pattern, category, gender, size, colour, availableQty, blockedQty, minimumRequired, unitPrice } = body;

    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE sasons_erp.store_garments 
         SET sku_no = ?, hsn_code = ?, description = ?, pattern = ?, category = ?, gender = ?, size = ?, color = ?, available_qty = ?, blocked_qty = ?, min_required = ?, unit_price = ?, last_updated = NOW() 
         WHERE garment_id = ?`,
        [skuNo, hsnCode, description, pattern, category, gender, size, colour, availableQty, blockedQty, minimumRequired, unitPrice, id]
      );
    } finally {
      connection.release();
    }
    
    return NextResponse.json({ success: true, message: `Garment ${id} updated successfully` });
  } catch (error: any) {
    console.error("Error updating garment:", error);
    return NextResponse.json({ success: false, error: 'Failed to update garment' }, { status: 500 });
  }
}
