import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM purchase_orders ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: rows
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Purchase Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
