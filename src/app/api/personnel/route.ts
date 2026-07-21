import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT full_name as name, role, contact_number as contact FROM users`
    );
    // You could filter by role if needed: WHERE role = 'Worker'
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching personnel:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
