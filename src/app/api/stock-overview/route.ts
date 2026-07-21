import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsHeaders, handleOptions } from '@/lib/cors';

export const OPTIONS = handleOptions;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'monthly';
    const type = searchParams.get('type') || 'article';

    let items: any[] = [];
    
    if (type === 'article' || type === 'raw') {
        const [rows]: any = await pool.query(`
            SELECT r.*, m.category 
            FROM article r 
            LEFT JOIN store_materials m ON r.description = m.material_name
        `);
        items = rows.map((row: any) => ({
            id: `RM-${row.id.toString().padStart(3, '0')}`,
            description: row.description,
            code: `RM-${row.id.toString().padStart(3, '0')}`,
            item_code: `RM-${row.id.toString().padStart(3, '0')}`,
            category: row.category,
            unit: row.unit,
            openingStock: Number(row.op_stock || 0),
            purchase: Number(row.purchases || 0),
            total: Number(row.total || 0),
            issue: Number(row.issue || 0),
            closing: Number(row.closing_stock || 0),
            wip: Number(row.wip_cutting || 0),
            netTotal: Number(row.total_qty || 0),
            rate: Number(row.rate || 0),
            totalAmount: Number(row.total_amount || 0),
            is_archived: false
        }));
    } else {
        const [rows]: any = await pool.query("SELECT * FROM finished_goods ORDER BY sr_no");
        items = rows.map((row: any) => ({
            id: `FG-${row.id.toString().padStart(3, '0')}`,
            srNo: row.sr_no,
            type: row.type,
            code: `FG-${row.id.toString().padStart(3, '0')}`,
            openingStock: Number(row.opening_stock || 0),
            production: Number(row.production || 0),
            sale: Number(row.sale || 0),
            closingStock: Number(row.closing_stock || 0),
            cost: Number(row.cost || 0),
            totalAmount: Number(row.total_amount || 0),
            unit: row.unit,
            is_archived: false
        }));
    }

    return NextResponse.json(items, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Stock Query Error:', error);
    // Return structured 500 error payload
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
