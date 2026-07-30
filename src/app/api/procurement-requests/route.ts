import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = `SELECT * FROM procurement_requests`;
    const params: any[] = [];

    if (status) {
      query += ` WHERE status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(query, params);
    
    // Format numeric and id fields
    const formattedRows = (rows as any[]).map(r => ({
      ...r,
      id: String(r.id),
      currentStock: r.current_stock,
      minRequired: r.min_required,
      shortageQty: r.shortage_qty
    }));

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error("Failed to fetch procurement requests:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch procurement requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, name, category, currentStock, minRequired, shortageQty, status } = body;

    if (!sku || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO procurement_requests (sku, name, category, current_stock, min_required, shortage_qty, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sku, 
        name, 
        category || 'General', 
        currentStock || 0, 
        minRequired || 0, 
        shortageQty || 0, 
        status || 'PENDING'
      ]
    );

    const newId = String((result as any).insertId);

    return NextResponse.json({ 
      success: true, 
      message: "Procurement request created", 
      data: { id: newId, ...body, status: status || 'PENDING' } 
    });

  } catch (error) {
    console.error("Failed to create procurement request:", error);
    return NextResponse.json({ success: false, error: "Failed to create procurement request" }, { status: 500 });
  }
}
