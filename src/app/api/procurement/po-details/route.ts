import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const po_number = searchParams.get('po_number');

    if (!po_number) {
      return NextResponse.json({ success: false, error: 'PO Number is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [orderRows]: any = await connection.query(
        `SELECT po_number, supplier_name, status, created_at, total_amount 
         FROM procurement_orders 
         WHERE po_number = ?`,
        [po_number]
      );

      if (orderRows.length === 0) {
        return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 });
      }

      const order = orderRows[0];

      // Fetch items from procurement_requests
      const [itemRows]: any = await connection.query(
        `SELECT item_name as description, order_qty as qty, unit_price, total_price 
         FROM procurement_requests 
         WHERE po_number = ?`,
        [po_number]
      );

      let totalAmount = 0;
      const items = itemRows.map((item: any) => {
        const unitPrice = item.unit_price ? parseFloat(item.unit_price) : 0;
        const subtotal = item.total_price ? parseFloat(item.total_price) : (item.qty * unitPrice);
        totalAmount += subtotal;
        
        return {
          description: item.description || 'Unnamed Item',
          qty: item.qty || 0,
          unitPrice: unitPrice,
          subtotal: subtotal
        };
      });

      // Override total with the DB total if it exists
      const grandTotal = order.total_amount ? parseFloat(order.total_amount) : totalAmount;
      const taxAmount = grandTotal * 0.18; // 18% GST mock
      const subTotalBase = grandTotal - taxAmount;

      return NextResponse.json({ 
        success: true, 
        data: {
          po_number: order.po_number,
          po_date: order.created_at,
          supplier_name: order.supplier_name,
          status: order.status,
          expected_delivery: "Pending", // Mock or add field
          items: items,
          subtotal: subTotalBase,
          taxAmount: taxAmount,
          gstPercentage: 18,
          grandTotal: grandTotal
        }
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Fetch PO Details Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
