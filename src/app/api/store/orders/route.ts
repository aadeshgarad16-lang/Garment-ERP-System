import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.query(`
      SELECT 
        po_number AS order_number, 
        supplier_name,
        total_items, 
        created_at AS date_of_order, 
        status AS status_of_delivery 
      FROM procurement_orders 
      WHERE status IN ('IN_PROCESS', 'COMPLETED', 'RECEIVED', 'ISSUE_ACTION_REQUIRED')
    `);

    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Store Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
