import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Failsafe SELECT * Query to prevent column name crashes
    const [rows]: any = await pool.query(`SELECT * FROM store_articles`);

    console.log(`[STORE_ARTICLES API SUCCESS] Retrieved ${rows.length} records.`);

    // Map database snake_case fields safely to expected frontend camelCase
    const formattedData = rows.map((item: any) => ({
      id: item.l_id || item.id || item.article_id || Math.random(),
      hsnCode: item.hsn_code || item.hsn || '—',
      materialName: item.material_name || item.name || item.article_name || 'Unnamed Material',
      description: item.description || '—',
      unit: item.unit || 'units',
      availableQty: Number(item.available_qty || item.quantity || 0),
      blockedQty: Number(item.blocked_qty || 0),
      minimumRequired: Number(item.min_required || item.minimum_required || 0),
      unitPrice: Number(item.unit_price || item.price || 0),
      totalPrice: Number(item.total_price || (Number(item.available_qty || 0) * Number(item.unit_price || 0))),
      status: item.status || 'Active'
    }));

    return NextResponse.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    }, { status: 200 });

  } catch (error: any) {
    console.error("[STORE_ARTICLES 500 ERROR DETAILS]:", error);

    // Return 200 with empty array instead of 500 crash so frontend handles UI gracefully
    return NextResponse.json({
      success: false,
      error: error.message || 'Database query error',
      data: []
    }, { status: 200 });
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
      id,
      hsn_code,
      material_name,
      description,
      category,
      unit,
      available_qty,
      blocked_qty,
      unit_price,
      min_required
    } = body;

    const recordId = id || body.l_id || body.article_id || body.material_id;

    if (!recordId) {
      return NextResponse.json({ success: false, message: 'Article primary key (id / l_id) is required for update.' }, { status: 400 });
    }

    let updateQuery = `
      UPDATE store_articles 
      SET 
        hsn_code = ?,
        material_name = ?,
        description = ?,
        category = ?,
        unit = ?,
        available_qty = ?,
        blocked_qty = ?,
        unit_price = ?,
        min_required = ?,
        total_price = (? * ?)
    `;

    const params = [
      hsn_code, material_name, description, category, unit,
      Number(available_qty || 0), Number(blocked_qty || 0), Number(unit_price || 0), Number(min_required || 0),
      Number(available_qty || 0), Number(unit_price || 0), recordId
    ];

    let result;
    try {
      // First attempt using l_id
      const [res1]: any = await pool.query(updateQuery + ` WHERE l_id = ?`, params);
      result = res1;
    } catch (err: any) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        try {
          // Fallback attempt using article_id
          const [res2]: any = await pool.query(updateQuery + ` WHERE article_id = ?`, params);
          result = res2;
        } catch (err2: any) {
          if (err2.code === 'ER_BAD_FIELD_ERROR') {
            // Final fallback attempt using material_id
            const [res3]: any = await pool.query(updateQuery + ` WHERE material_id = ?`, params);
            result = res3;
          } else {
            throw err2;
          }
        }
      } else {
        throw err;
      }
    }

    if (result && result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Article record not found in database.' }, { status: 404 });
    }

    console.log(`[UPDATE ARTICLE SUCCESS] Updated ID: ${recordId}`);

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully in database'
    }, { status: 200 });

  } catch (error: any) {
    console.error("[UPDATE ARTICLE ERROR]:", error);
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
