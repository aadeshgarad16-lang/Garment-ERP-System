import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        'ARTICLE' AS type,
        material_id AS id,
        hsn_code,
        material_name,
        description,
        category,
        unit,
        available_qty,
        blocked_qty,
        min_required,
        unit_price,
        total_price,
        status,
        last_updated,
        is_deleted
      FROM sasons_erp.store_articles 
      
      UNION ALL
      
      SELECT 
        'FINISHED_GOODS' AS type,
        garment_id AS id,
        sku_no AS hsn_code,
        CONCAT(category, ' - ', gender, ' (', size, ')') AS material_name,
        description,
        category,
        'Piece' AS unit,
        available_qty,
        blocked_qty,
        min_required,
        unit_price,
        total_price,
        status,
        last_updated,
        is_deleted
      FROM sasons_erp.store_garments
      
      ORDER BY last_updated DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        materials: rows || [],
        totalRecords: Array.isArray(rows) ? rows.length : 0
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Backend Error in material-master API:", error?.message || error);
    return NextResponse.json({
      success: false,
      data: {
        materials: [],
        totalRecords: 0
      },
      error: error?.message || "Internal Server Error"
    }, { status: 500 });
  }
}
