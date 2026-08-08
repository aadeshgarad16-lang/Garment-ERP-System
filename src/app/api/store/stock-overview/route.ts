import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT * 
      FROM sasons_erp.stock_overview 
      ORDER BY id DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: rows || []
    }, { status: 200 });
  } catch (error: any) {
    console.error("Backend Error in stock-overview API:", error?.message || error);
    return NextResponse.json({
      success: false,
      data: [],
      error: error?.message || "Internal Server Error"
    }, { status: 500 });
  }
}
