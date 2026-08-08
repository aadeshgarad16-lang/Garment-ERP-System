import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows]: any = await connection.query(
      `SELECT status, COUNT(*) as count FROM procurement_requests GROUP BY status`
    );
    let pendingCount = 0;
    let reviewCount = 0;
    
    rows.forEach((row: any) => {
      if (row.status === 'PENDING' || row.status === 'DASHBOARD_PENDING') pendingCount += row.count;
      if (row.status === 'REVIEW_PO') reviewCount += row.count;
    });

    // We can also fetch the number of drafts if needed, or assume reviewCount handles it.
    // createCount can be left as 0 since it's a transient frontend state.
    
    return NextResponse.json({ success: true, pendingCount, reviewCount, createCount: 0 });
  } catch (error: any) {
    console.error("Failed to fetch stage counts:", error);
    return NextResponse.json({ success: false, pendingCount: 0, reviewCount: 0, createCount: 0 }, { status: 500 });
  } finally {
    connection.release();
  }
}
