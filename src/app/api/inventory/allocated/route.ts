import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const poNumber = searchParams.get('poNumber');

  if (!poNumber) {
    return NextResponse.json({ error: 'poNumber is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         b.bom_id as id,
         m.material_name as materials_inventory,
         m.category as category,
         b.final_qty as required_qty,
         b.per_piece_qty as per_piece_qty,
         m.available_qty as available_qty,
         GREATEST(0, b.final_qty - m.available_qty) as shortage_qty,
         m.unit as unit,
         b.allocation_status as status
       FROM bill_of_materials b
       JOIN store_materials m ON b.material_id = m.material_id
       WHERE b.po_number = ?`,
      [poNumber]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching allocated inventory:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
