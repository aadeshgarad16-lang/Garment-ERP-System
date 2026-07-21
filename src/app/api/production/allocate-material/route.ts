import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poNumber, allocations, stage } = body;

    if (!poNumber || !allocations || !Array.isArray(allocations)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const alloc of allocations) {
        if (!alloc.assigned_person_id || !alloc.allocated_qty) continue;

        await connection.query(
          `INSERT INTO material_allocations (po_number, material_id, allocated_qty, remaining_qty, assigned_person_id, stage)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            poNumber, 
            alloc.material_id || alloc.id, // Fallback to id
            alloc.allocated_qty, 
            alloc.remaining_qty || 0,
            alloc.assigned_person_id, 
            stage || 'Cutting'
          ]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Material allocations saved successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Allocation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
