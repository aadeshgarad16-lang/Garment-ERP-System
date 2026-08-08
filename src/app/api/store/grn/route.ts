import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { po_number, total_rejections, received_qty, is_full, items } = await req.json();

    if (!po_number) {
      return NextResponse.json({ success: false, error: 'PO Number is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let newStatus = 'COMPLETED';
      if (total_rejections > 0) {
        newStatus = 'ISSUE_ACTION_REQUIRED';
      }

      // Update procurement_orders
      await connection.query(
        `UPDATE procurement_orders 
         SET status = ? 
         WHERE po_number = ?`,
        [newStatus, po_number]
      );

      // Update procurement_requests
      await connection.query(
        `UPDATE procurement_requests 
         SET status = ? 
         WHERE po_number = ?`,
        [newStatus, po_number]
      );

      // Update store_orders
      await connection.query(
        `UPDATE store_orders 
         SET status = ? 
         WHERE order_number = ?`,
        [newStatus, po_number]
      );

      // Loop through items and update inventory
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const deliveredQty = Number(item.deliveredQty || 0);
          if (deliveredQty > 0) {
            const sku = item.sku || null;
            const itemName = item.item_name || 'Unknown';
            const category = String(item.category || '').toUpperCase();
            
            // Determine table based on category
            if (category.includes('FINISHED') || category.includes('SHIRT') || category.includes('GARMENT')) {
              await connection.query(
                `UPDATE store_garments 
                 SET available_qty = available_qty + ? 
                 WHERE (sku_no = ? OR description = ?)`,
                [deliveredQty, sku, itemName]
              ).catch((e: any) => console.log('Store garments table update skipped/error:', e.message));
            } else {
              await connection.query(
                `UPDATE material_master 
                 SET current_stock = current_stock + ? 
                 WHERE (sku = ? OR item_name = ?)`,
                [deliveredQty, sku, itemName]
              ).catch((e: any) => console.log('Material master table update skipped/error:', e.message));
            }

            // Unified stock overview table
            await connection.query(
              `UPDATE stock_overview 
               SET available_qty = available_qty + ?, 
                   last_updated = NOW() 
               WHERE (sku = ? OR item_name = ?)`,
              [deliveredQty, sku, itemName]
            ).catch(() => {}); // Safely ignore if table doesn't exist
          }
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'GRN synced successfully' }, { status: 200 });
    } catch (error: any) {
      await connection.rollback();
      console.error("GRN Sync DB Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("GRN Sync API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
