import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get('stage');

    let query = `SELECT * FROM purchase_orders`;
    let params: any[] = [];

    if (stageParam) {
      const stages = stageParam.split(',').map(s => s.trim());
      if (stages.length === 1) {
        query += ` WHERE stage = ?`;
        params.push(stages[0]);
      } else {
        const placeholders = stages.map(() => '?').join(',');
        query += ` WHERE stage IN (${placeholders})`;
        params.push(...stages);
      }
    }

    query += ` ORDER BY created_at DESC`;

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Purchase Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
