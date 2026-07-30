import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id, 10);
    if (isNaN(supplierId)) {
      return NextResponse.json({ success: false, error: "Invalid supplier ID" }, { status: 400 });
    }

    const [rows] = await db.query(
      `SELECT * FROM supplier_addresses WHERE supplier_id = ? ORDER BY is_default DESC, created_at ASC`,
      [supplierId]
    );

    // Format boolean fields properly since mysql returns 1/0
    const formattedRows = (rows as any[]).map(r => ({
      ...r,
      id: String(r.id),
      supplier_id: String(r.supplier_id),
      isDefault: Boolean(r.is_default)
    }));

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Failed to fetch supplier addresses:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id, 10);
    if (isNaN(supplierId)) {
      return NextResponse.json({ success: false, error: "Invalid supplier ID" }, { status: 400 });
    }

    const body = await request.json();

    // If this new one is set as default, we should unset others of the same type
    if (body.isDefault) {
      await db.query(
        `UPDATE supplier_addresses SET is_default = FALSE WHERE supplier_id = ? AND type = ?`,
        [supplierId, body.type || 'consignee']
      );
    }

    const [result] = await db.query(
      `INSERT INTO supplier_addresses (
        supplier_id, name, line1, line2, city, country, contact, is_default, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplierId,
        body.name || 'Unnamed',
        body.line1 || '',
        body.line2 || null,
        body.city || '',
        body.country || 'India',
        body.contact || null,
        body.isDefault ? true : false,
        body.type || 'consignee'
      ]
    );

    const newId = String((result as any).insertId);

    const newAddress = {
      id: newId,
      supplier_id: String(supplierId),
      name: body.name || 'Unnamed',
      line1: body.line1 || '',
      line2: body.line2 || null,
      city: body.city || '',
      country: body.country || 'India',
      contact: body.contact || null,
      isDefault: body.isDefault ? true : false,
      type: body.type || 'consignee'
    };

    return NextResponse.json({
      success: true,
      message: "Address created successfully",
      data: newAddress
    });

  } catch (error) {
    console.error("Failed to create address:", error);
    return NextResponse.json({ success: false, error: "Failed to create address" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id, 10);
    const body = await request.json();
    const addressId = parseInt(body.addressId, 10);
    const type = body.type || 'consignee';

    if (isNaN(supplierId) || isNaN(addressId)) {
      return NextResponse.json({ success: false, error: "Invalid IDs" }, { status: 400 });
    }

    // Unset all defaults for this supplier and type
    await db.query(
      `UPDATE supplier_addresses SET is_default = FALSE WHERE supplier_id = ? AND type = ?`,
      [supplierId, type]
    );

    // Set the specific address as default
    await db.query(
      `UPDATE supplier_addresses SET is_default = TRUE WHERE id = ? AND supplier_id = ?`,
      [addressId, supplierId]
    );

    return NextResponse.json({ success: true, message: "Default address updated" });
  } catch (error) {
    console.error("Failed to update default address:", error);
    return NextResponse.json({ success: false, error: "Failed to update default address" }, { status: 500 });
  }
}
