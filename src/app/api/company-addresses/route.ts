import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT * FROM company_addresses ORDER BY created_at DESC`
    );

    const formattedRows = (rows as any[]).map(r => ({
      id: String(r.id),
      entityName: r.entity_name,
      fullAddress: r.full_address,
      email: r.email,
      gstin: r.gstin,
      panUn: r.pan_un,
      phone: r.phone,
      type: r.type,
      isDefaultInvoice: Boolean(r.is_default_invoice),
      isDefaultConsignee: Boolean(r.is_default_consignee),
    }));

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error("Failed to fetch company addresses:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If this new one is set as default invoice, unset others
    if (body.isDefaultInvoice) {
      await db.query(
        `UPDATE company_addresses SET is_default_invoice = FALSE`
      );
    }
    
    // If this new one is set as default consignee, unset others
    if (body.isDefaultConsignee) {
      await db.query(
        `UPDATE company_addresses SET is_default_consignee = FALSE`
      );
    }

    const [result] = await db.query(
      `INSERT INTO company_addresses (
        entity_name, full_address, email, gstin, pan_un, phone, type, is_default_invoice, is_default_consignee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.entityName || 'Unnamed Entity',
        body.fullAddress || '',
        body.email || null,
        body.gstin || null,
        body.panUn || null,
        body.phone || null,
        body.type || 'Branch / Warehouse',
        body.isDefaultInvoice ? true : false,
        body.isDefaultConsignee ? true : false
      ]
    );

    const newId = String((result as any).insertId);

    const newAddress = {
      id: newId,
      entityName: body.entityName || 'Unnamed Entity',
      fullAddress: body.fullAddress || '',
      email: body.email || null,
      gstin: body.gstin || null,
      panUn: body.panUn || null,
      phone: body.phone || null,
      type: body.type || 'Branch / Warehouse',
      isDefaultInvoice: body.isDefaultInvoice ? true : false,
      isDefaultConsignee: body.isDefaultConsignee ? true : false
    };

    return NextResponse.json({
      success: true,
      message: "Address created successfully",
      data: newAddress
    });

  } catch (error) {
    console.error("Failed to create company address:", error);
    return NextResponse.json({ success: false, error: "Failed to create address" }, { status: 500 });
  }
}
