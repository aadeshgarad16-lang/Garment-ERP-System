import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete logic: UPDATE finished_goods SET is_archived = true WHERE id = id
    await pool.query('UPDATE finished_goods SET is_archived = true WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: `Archived item ${id}` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
