import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [totalRows]: any = await pool.query(`
      SELECT 
        COUNT(*) AS totalGarments,
        SUM(CASE WHEN available_qty > min_required THEN 1 ELSE 0 END) AS availableItems,
        SUM(CASE WHEN available_qty > 0 AND available_qty <= min_required THEN 1 ELSE 0 END) AS lowStockItems,
        SUM(CASE WHEN available_qty = 0 THEN 1 ELSE 0 END) AS outOfStockItems
      FROM sasons_erp.store_garments
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        totalGarments: Number(totalRows[0]?.totalGarments || 0),
        availableItems: Number(totalRows[0]?.availableItems || 0),
        lowStockItems: Number(totalRows[0]?.lowStockItems || 0),
        outOfStockItems: Number(totalRows[0]?.outOfStockItems || 0)
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch finished goods dashboard', error);
    return NextResponse.json({
      success: false,
      data: {
        totalGarments: 0,
        availableItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      },
      error: error?.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
