import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { po_number, supplier_name, item_ids, grand_total, item_name, items } = await req.json();
    const total_items = item_ids ? item_ids.length : 0;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Ensure store_orders exists since user requested insertion into it
      await connection.query(`
        CREATE TABLE IF NOT EXISTS store_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_number VARCHAR(100),
          supplier_name VARCHAR(255),
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure procurement_orders exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS procurement_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          po_number VARCHAR(100) UNIQUE,
          supplier_name VARCHAR(255),
          total_items INT,
          total_amount DECIMAL(10, 2),
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // A. Create record in procurement_orders table
      await connection.query(
        `INSERT INTO procurement_orders (po_number, supplier_name, total_items, total_amount, status, created_at)
         VALUES (?, ?, ?, ?, 'IN_PROCESS', NOW())
         ON DUPLICATE KEY UPDATE status = 'IN_PROCESS'`,
        [po_number, supplier_name, total_items, grand_total]
      );

      // Process line items
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemId = item_ids && item_ids[i] ? item_ids[i] : 0;
          const itemName = item.item_name || item.name || item.description || item.material || 'Unnamed Item';
          
          const unitPrice = Number(item.unit_price || item.rate || item.price || 0);
          const totalPrice = Number(item.total_price || item.subtotal || (unitPrice * Number(item.quantity || item.order_qty || 0)));

          const [updateResult]: any = await connection.query(
            `UPDATE procurement_requests 
             SET status = 'IN_PROCESS', po_number = ?, unit_price = ?, total_price = ?
             WHERE (item_name = ? 
                OR ? LIKE CONCAT(item_name, '%')
                OR sku = ? 
                OR id = ?) AND status = 'PENDING'`,
            [po_number, unitPrice, totalPrice, itemName, itemName, item.sku || null, itemId]
          );

          if (updateResult.affectedRows === 0) {
            await connection.query(
              `INSERT INTO procurement_requests (po_number, supplier_name, sku, item_name, category, order_qty, unit, unit_price, total_price, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROCESS')`,
              [po_number, supplier_name, item.sku, itemName, item.category, item.order_qty || item.quantity, item.unit, unitPrice, totalPrice]
            );
          }
        }
      }

      // D. Sync with Store Orders table
      await connection.query(
        `INSERT INTO store_orders (order_number, supplier_name, status, created_at)
         VALUES (?, ?, 'IN_PROCESS', NOW())`,
        [po_number, supplier_name]
      );

      await connection.commit();
      return NextResponse.json({ success: true, message: 'PO confirmed in DB' }, { status: 200 });
    } catch (error: any) {
      await connection.rollback();
      console.error("PO Confirmation Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
