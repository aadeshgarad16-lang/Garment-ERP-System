import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('po_number');

    if (!poNumber) {
      return NextResponse.json({ success: false, error: 'po_number is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, po_number, material_name, category, allocated_qty, lock_status, status 
         FROM allocated_material 
         WHERE po_number = ? 
         ORDER BY category ASC, material_name ASC`,
        [poNumber]
      );
      return NextResponse.json({ success: true, data: rows });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('API /api/production/material-card error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
