import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { po_number, supplier_name, total_items, total_price, items } = body;
    
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Insert into purchase_orders
      // We will map total_price to grand_total (and total_value if needed)
      await connection.query(
        `INSERT INTO purchase_orders (po_number, supplier_name, grand_total, total_value, status, created_at, customer_id)
         VALUES (?, ?, ?, ?, 'ORDERED', NOW(), 1)`,
        [po_number, supplier_name, total_price, total_price]
      );

      // 2. Update line items in procurement_requests
      if (items && items.length > 0) {
        for (const item of items) {
          await connection.query(
            `UPDATE procurement_requests 
             SET status = 'ORDERED', po_number = ?, updated_at = NOW()
             WHERE sku = ? AND status IN ('PENDING', 'DASHBOARD_PENDING', 'REVIEW_PO')`,
            [po_number, item.sku]
          );
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Order created successfully' }, { status: 200 });
    } catch (error: any) {
      await connection.rollback();
      console.error("Create Order Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
