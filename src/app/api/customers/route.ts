import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM customers`
    );

    return NextResponse.json({
      success: true,
      data: rows
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Customers Error:", error);
    // If table doesn't exist, just return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
