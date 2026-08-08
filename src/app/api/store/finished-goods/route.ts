import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isArchived = searchParams.get('isArchived') === 'true';
    
    const query = `
      SELECT * 
      FROM sasons_erp.store_garments 
      ORDER BY garment_id DESC
    `;
    
    const [rows] = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: rows || []
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Backend Error in fetchGarments API:", error?.message || error);

    // Return a valid JSON error payload
    return NextResponse.json({
      success: false,
      data: [],
      error: error?.message || "Internal Server Error"
    }, { status: 500 });
  }
}
