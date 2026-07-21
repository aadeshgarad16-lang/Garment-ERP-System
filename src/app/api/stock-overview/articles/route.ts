import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsHeaders, handleOptions } from '@/lib/cors';

export const OPTIONS = handleOptions;

export async function GET() {
  try {
    const [rows]: any = await pool.query("SELECT * FROM article");
    
    const articles = rows.map((row: any) => ({
        id: `RM-${row.id.toString().padStart(3, '0')}`,
        description: row.description,
        code: `RM-${row.id.toString().padStart(3, '0')}`,
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
        is_archived: false // Default to false if not in schema
    }));
    
    return NextResponse.json({
      success: true,
      data: articles
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
