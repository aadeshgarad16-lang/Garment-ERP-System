import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { corsHeaders, handleOptions } from '@/lib/cors';

export const OPTIONS = handleOptions;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'monthly';
    const type = searchParams.get('type') || 'article';

    const [rows]: any = await pool.query(`
      SELECT id, description, unit, op_stock, purchases, total, issue, closing_stock, wip_cutting, total_qty, rate, total_amount 
      FROM stock_overview 
      ORDER BY id ASC;
    `);

    const items = rows.map((row: any) => ({
      id: row.id,
      description: row.description,
      code: row.id,
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
      is_archived: false,
      type: type
    }));

    return NextResponse.json({ success: true, data: items }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Stock Overview Database Error:', error);
    // Return graceful fallback response
    return NextResponse.json(
      { success: false, data: [], message: error.message },
      { status: 200, headers: corsHeaders }
    );
  }
}
