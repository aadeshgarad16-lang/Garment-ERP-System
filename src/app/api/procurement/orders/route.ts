import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.query(`
      SELECT 
        po_number, 
        supplier_name, 
        status, 
        total_amount as total_price, 
        created_at,
        (SELECT COUNT(*) FROM procurement_requests WHERE po_number = procurement_orders.po_number) as total_items
      FROM procurement_orders
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
