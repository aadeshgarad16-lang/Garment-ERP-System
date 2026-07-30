import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, 
        company_name as companyName, 
        contact_person as contactPerson, 
        email_address as emailAddress, 
        phone_mobile as phone, 
        registered_address as registeredAddress, 
        gstin_tax_id as gstId, 
        payment_terms as paymentTerms 
      FROM supplier_Info
      ORDER BY created_at DESC
    `);
    
    // Convert int IDs to string so frontend matching (which expects string IDs) doesn't break
    const formattedRows = (rows as any[]).map(r => ({ ...r, id: String(r.id) }));
    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const [result] = await db.query(
      `INSERT INTO supplier_Info (
        company_name, 
        contact_person, 
        phone_mobile, 
        email_address, 
        registered_address, 
        gstin_tax_id, 
        payment_terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.companyName || body.name || 'Unknown Supplier',
        body.contactPerson || null,
        body.phone || null,
        body.email || null,
        body.address || null,
        body.gstin || null,
        body.paymentTerms || 'Net 30 Days'
      ]
    );

    const newId = String((result as any).insertId);

    const newSupplier = {
      id: newId,
      companyName: body.companyName || body.name || 'Unknown Supplier',
      contactPerson: body.contactPerson,
      phone: body.phone,
      emailAddress: body.email,
      registeredAddress: body.address,
      gstId: body.gstin,
      paymentTerms: body.paymentTerms
    };

    return NextResponse.json({
      success: true,
      message: "Supplier created successfully",
      data: newSupplier
    });

  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}
