import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Total Orders
    const [totalRows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM purchase_orders`
    );
    const totalOrders = totalRows[0]?.count || 0;

    // 2. Active Production
    const [prodRows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE stage = 'Production'`
    );
    const activeProduction = prodRows[0]?.count || 0;

    // 3. Pending Procurement
    const [procRows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE stage = 'Procurement'`
    );
    const pendingProcurement = procRows[0]?.count || 0;

    // 4. Group by Stage
    const [stageRows]: any = await pool.query(
      `SELECT stage, COUNT(*) as count FROM purchase_orders GROUP BY stage`
    );
    
    // Structure the productionStages map exactly as the frontend expects
    const productionStages: Record<string, { count: number; capacity: number }> = {
      'Order Initiation': { count: 0, capacity: 100 },
      'Specifications': { count: 0, capacity: 100 },
      'Stock Check': { count: 0, capacity: 100 },
      'BOM Calculation': { count: 0, capacity: 100 },
      'Inventory Check': { count: 0, capacity: 100 },
      'Material Allocation': { count: 0, capacity: 100 },
      'Procurement': { count: 0, capacity: 100 },
      'Material Release': { count: 0, capacity: 100 },
      'Production': { count: 0, capacity: 100 }
    };

    stageRows.forEach((row: any) => {
      const stageName = row.stage || 'Initiation';
      if (productionStages[stageName]) {
        productionStages[stageName].count = row.count;
      }
    });

    // 5. Recent Orders (limit 10)
    const [recentRows]: any = await pool.query(
      `SELECT * FROM purchase_orders ORDER BY created_at DESC LIMIT 10`
    );

    const statsData = {
      totalOrders,
      activeProduction,
      pendingProcurement,
      inventoryAlerts: 0, // Fallback
      productionStages
    };

    return NextResponse.json({
      success: true,
      statsData,
      recentOrders: recentRows
    }, { status: 200 });

  } catch (error: any) {
    console.error("Dashboard Summary API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
