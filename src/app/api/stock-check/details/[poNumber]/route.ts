import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your MySQL pool connection

export async function GET(
  request: Request,
  context: { params: Promise<{ poNumber: string }> }
) {
  try {
    const params = await context.params;
    const poNumber = params.poNumber;

    if (!poNumber) {
      return NextResponse.json({ error: 'PO Number parameter is required' }, { status: 400 });
    }

    // 1. Fetch main PO header record safely
    const [orders]: any = await pool.query(
      `SELECT * FROM purchase_orders WHERE po_number = ?`,
      [poNumber]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: `PO ${poNumber} not found` }, { status: 404 });
    }

    // 2. Fetch specifications using the EXACT table name verified in MySQL Workbench
    // Replace 'order_specifications' with your actual table name if different
    const [specs]: any = await pool.query(
      `SELECT * FROM specifications WHERE po_number = ?`,
      [poNumber]
    );

    const po = orders[0];

    return NextResponse.json({
      success: true,
      poNumber: po.po_number || poNumber,
      customerName: po.customer_name || po.contact_name || po.client_name || '',
      poDate: po.po_date || po.order_date || po.created_at || '',
      deliveryDate: po.delivery_date || '',
      items: specs || []
    });

  } catch (error: any) {
    // THIS WILL PRINT THE EXACT SQL ERROR IN YOUR TERMINAL / SERVER CONSOLE
    console.error("❌ Stock Check API Server Error:", error.message || error);

    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error.message || "Database query failed" 
      }, 
      { status: 500 }
    );
  }
}
