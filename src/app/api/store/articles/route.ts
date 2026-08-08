import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [articles]: any = await pool.query(`
      SELECT 
        material_id AS id,
        COALESCE(hsn_code, '') AS hsnCode,
        COALESCE(hsn_code, '') AS hsn_code,
        COALESCE(material_name, '') AS materialName,
        COALESCE(material_name, '') AS material_name,
        COALESCE(description, '') AS description,
        COALESCE(category, '') AS category,
        COALESCE(unit, 'Pcs') AS unit,
        COALESCE(available_qty, 0) AS availableQty,
        COALESCE(available_qty, 0) AS available_qty,
        COALESCE(blocked_qty, 0) AS blockedQty,
        COALESCE(blocked_qty, 0) AS blocked_qty,
        COALESCE(unit_price, 0) AS unitPrice,
        COALESCE(unit_price, 0) AS unit_price,
        (COALESCE(available_qty, 0) * COALESCE(unit_price, 0)) AS total_price,
        COALESCE(min_required, 0) AS minRequired,
        COALESCE(min_required, 0) AS min_required,
        UPPER(COALESCE(status, 'AVAILABLE')) AS status,
        created_at,
        updated_at
      FROM sasons_erp.store_articles
      WHERE (is_deleted IS NULL OR is_deleted = 0)
      ORDER BY material_id DESC
    `);
    
    return NextResponse.json({
      success: true,
      count: articles.length,
      data: articles || []
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Articles Error:", error?.message || error);
    return NextResponse.json({
      success: false,
      data: [],
      error: error?.message || "Internal Server Error"
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      hsn_code, material_name, description, category, unit, 
      available_qty, blocked_qty, min_required, unit_price, status
    } = body;
    
    const [result]: any = await pool.query(`
      INSERT INTO sasons_erp.store_articles 
      (hsn_code, material_name, description, category, unit, available_qty, blocked_qty, min_required, unit_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [hsn_code, material_name, description, category, unit, available_qty, blocked_qty || 0, min_required, unit_price, status || 'Active']);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error("Create Article Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id, hsn_code, material_name, description, category, unit, 
      available_qty, blocked_qty, min_required, unit_price, status
    } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    await pool.query(`
      UPDATE sasons_erp.store_articles 
      SET 
        hsn_code = ?,
        material_name = ?,
        description = ?,
        category = ?,
        unit = ?,
        available_qty = ?,
        blocked_qty = ?,
        min_required = ?,
        unit_price = ?,
        status = ?
      WHERE material_id = ?
    `, [hsn_code, material_name, description, category, unit, available_qty, blocked_qty || 0, min_required, unit_price, status, id]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Update Article Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      const body = await req.json().catch(() => ({}));
      if (body.id) {
        await pool.query('UPDATE sasons_erp.store_articles SET is_deleted = 1 WHERE material_id = ?', [body.id]);
        return NextResponse.json({ success: true, id: body.id });
      }
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    await pool.query('UPDATE sasons_erp.store_articles SET is_deleted = 1 WHERE material_id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Delete Article Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
