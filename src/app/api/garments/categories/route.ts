import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM garment_bom_table WHERE category IS NOT NULL');
    const categories = (rows as any[]).map(row => row.category);
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
