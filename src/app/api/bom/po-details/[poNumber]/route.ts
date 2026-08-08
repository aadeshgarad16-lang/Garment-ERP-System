import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ poNumber: string }> }) {
  try {
    const params = await context.params;
    let rawPoNumber = params.poNumber;
    
    if (!rawPoNumber) {
      return NextResponse.json({ success: false, data: null, message: 'PO Number not found' }, { status: 200 });
    }

    let poNumber = decodeURIComponent(rawPoNumber).trim();
    // Strip appended customer string e.g., "PO-2024-005 (Rishi)" -> "PO-2024-005"
    if (poNumber.includes('(')) {
      poNumber = poNumber.split('(')[0].trim();
    }
    // Handle specific dropdown format "PO: PO-2024-005 | Customer: Rishi"
    if (poNumber.includes('|')) {
      poNumber = poNumber.split('|')[0].replace('PO:', '').trim();
    }

    console.log("[BOM API] Searching calculations for PO:", poNumber);

    if (poNumber === '') {
      return NextResponse.json({ success: false, data: null, message: 'PO Number not found' }, { status: 200 });
    }

    const poQuery = `
      SELECT 
        po_number, customer_id, status, total_value, order_date, delivery_date, contact_person,
        contact_phone, contact_email, delivery_type, delivery_address, delivery_pin, delivery_location_type,
        billing_company, billing_address, billing_pin, gst_number, cin_number, test_certificate,
        transport_cost, payment_term, advance_amount, stage, created_at, production_stages,
        quality_stages, contact_name, bill_to, gst_no, cin_no, po_file_path, sleeve_type
      FROM purchase_orders 
      WHERE po_number = ? LIMIT 1
    `;
    
    const [poRows]: any = await pool.query(poQuery, [poNumber]);

    if (!poRows || poRows.length === 0) {
      return NextResponse.json({ success: false, data: null, message: 'PO Number not found' }, { status: 200 });
    }

    const poDetails = poRows[0];

    const specsQuery = `
      SELECT 
        spec_id, po_number, fabric_type, size, color, style, remarks, item_description,
        pattern, stock_available, unit_price, photo_name, use_existing_stock, quantity,
        allocated_qty, delivery_address, delivery_pin, stock_status, sleeve_type
      FROM specifications 
      WHERE po_number = ?
    `;

    const [specsRows]: any = await pool.query(specsQuery, [poNumber]);

    return NextResponse.json({
      success: true,
      po_number: poDetails.po_number,
      ...poDetails,
      specs: specsRows
    });

  } catch (error: any) {
    console.error('Error fetching PO Details:', error);
    return NextResponse.json({ success: false, data: null, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

