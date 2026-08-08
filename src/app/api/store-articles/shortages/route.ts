import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [shortages]: any = await pool.query(`
      SELECT 
        'ARTICLE' AS item_type,
        material_id AS source_id,
        hsn_code AS sku_code,
        material_name AS item_name,
        category,
        COALESCE(available_qty, 0) AS available_qty,
        COALESCE(min_required, 0) AS min_required,
        (COALESCE(min_required, 0) - COALESCE(available_qty, 0)) AS deficit_qty,
        COALESCE(unit, 'Units') AS unit,
        'PENDING' AS stock_status,
        CONCAT('PR-ARTICLE-store_articles-', material_id) AS unique_key,
        COALESCE(description, '') AS item_description
      FROM sasons_erp.store_articles
      WHERE COALESCE(available_qty, 0) <= COALESCE(min_required, 0)
        AND (is_deleted IS NULL OR is_deleted = 0)

      UNION ALL

      SELECT 
        'FINISHED_GOODS' AS item_type,
        garment_id AS source_id,
        sku_no AS sku_code,
        CONCAT(category, ' - ', gender, ' (', size, ')') AS item_name,
        category,
        COALESCE(available_qty, 0) AS available_qty,
        COALESCE(min_required, 0) AS min_required,
        (COALESCE(min_required, 0) - COALESCE(available_qty, 0)) AS deficit_qty,
        'Pcs' AS unit,
        'PENDING' AS stock_status,
        CONCAT('PR-FINISHED_GOODS-store_garments-', garment_id) AS unique_key,
        COALESCE(pattern, description, '') AS item_description
      FROM sasons_erp.store_garments
      WHERE COALESCE(available_qty, 0) <= COALESCE(min_required, 0)
        AND (is_deleted IS NULL OR is_deleted = 0)
      ORDER BY deficit_qty DESC
    `);

    return NextResponse.json({ 
      success: true, 
      count: shortages.length,
      data: shortages 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Shortages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
