import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('po_number');

    if (!poNumber) {
      return NextResponse.json({ success: false, error: 'po_number is required' }, { status: 400 });
    }

    const query = `
      SELECT 
        s.spec_id,
        s.po_number,
        s.fabric_type,
        s.item_description,
        s.size AS spec_size,
        s.quantity,
        s.sleeve_type,
        gbc.id AS calc_id,
        gbc.item_name,
        gbc.size AS gbc_size,
        gbc.fabric_width,
        gbc.fabric_full_sleeve,
        gbc.fabric_half_sleeve,
        gbc.cuff,
        gbc.thread,
        gbc.collar,
        gbc.placket,
        gbc.size_label,
        gbc.washcare_label,
        gbc.overlock_thread,
        gbc.main_label,
        gbc.brand_label,
        gbc.polybag,
        gbc.box,
        gbc.clip
      FROM specifications s
      INNER JOIN purchase_orders po ON po.po_number = s.po_number
      LEFT JOIN garment_bom_calculations gbc 
        ON (gbc.item_name = s.fabric_type OR gbc.item_name = s.item_description)
      WHERE s.po_number = ?
    `;

    const [rows]: any = await pool.query(query, [poNumber]);

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error: any) {
    console.error('Error fetching BOM details:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
