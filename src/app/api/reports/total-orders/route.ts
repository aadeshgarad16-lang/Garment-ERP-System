import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [rows]: any = await pool.query(`SELECT * FROM purchase_orders ORDER BY created_at DESC`);
    
    let pending = 0;
    let inProduction = 0;
    let cutting = 0;
    let delivered = 0;

    for (const row of rows) {
      const stage = (row.stage || '').toLowerCase();
      if (['initiation', 'procurement', 'stock check', 'material allocation'].includes(stage)) {
        pending++;
      } else if (['production', 'material release', 'bom calculation'].includes(stage)) {
        inProduction++;
      } else if (stage === 'cutting') {
        cutting++;
      } else if (stage === 'dispatched' || stage === 'delivered') {
        delivered++;
      } else {
        pending++; // Default fallback
      }
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      records: rows,
      summary: {
        pending,
        inProduction,
        cutting,
        delivered
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Total Orders Report Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
