import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsHeaders, handleOptions } from '@/lib/cors';

export const OPTIONS = handleOptions;

export async function GET() {
  try {
    const [rows]: any = await pool.query("SELECT * FROM finished_goods ORDER BY sr_no");
    
    const finishedGoods = rows.map((row: any) => ({
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
    
    return NextResponse.json({
      success: true,
      data: finishedGoods
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
