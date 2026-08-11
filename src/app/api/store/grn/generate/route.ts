import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { po_number, acceptedQty, damagedQty, damageReason, status } = await req.json();

    if (!po_number) {
      return NextResponse.json({ success: false, error: 'PO Number is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const newStage = status === 'COMPLETED' ? 'Store Received' : 'Issue - GRN';

      // Update purchase_orders as requested
      await connection.query(
        `UPDATE purchase_orders 
         SET status = ?, current_stage = ?, receiving_date = NOW() 
         WHERE po_number = ?`,
        [status, newStage, po_number]
      );

      // Increment inventory if items were accepted
      if (acceptedQty > 0) {
        // Find if this PO is associated with articles or garments based on PO prefix
        if (po_number.includes('-FG-')) {
          await connection.query(
            `UPDATE store_garments 
             SET available_qty = available_qty + ? 
             WHERE id IN (
               SELECT item_id FROM procurement_orders WHERE po_number = ?
             )`,
            [acceptedQty, po_number]
          ).catch((e: any) => console.log('Store garments update skipped/error:', e.message));
        } else {
          await connection.query(
            `UPDATE store_articles 
             SET available_qty = available_qty + ? 
             WHERE l_id IN (
               SELECT item_id FROM procurement_orders WHERE po_number = ?
             )`,
            [acceptedQty, po_number]
          ).catch((e: any) => console.log('Store articles update skipped/error:', e.message));
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'GRN generated successfully' }, { status: 200 });
    } catch (error: any) {
      await connection.rollback();
      console.error("GRN Generate DB Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("GRN Generate API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
