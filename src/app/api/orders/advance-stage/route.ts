import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poNumber, currentStage, nextStage } = body;

    if (!poNumber) {
      return NextResponse.json({ success: false, message: 'PO Number is required' }, { status: 400 });
    }

    // Update the PO status in the main orders table
    const [updateResult] = await pool.query(
      `UPDATE purchase_orders 
       SET current_stage = ?, 
           status = ?, 
           updated_at = NOW() 
       WHERE po_number = ? OR id = ?`,
      [nextStage || 'BOM Calculation', nextStage || 'BOM Calculation', poNumber, poNumber]
    );

    console.log(`--> PO ${poNumber} ADVANCED FROM ${currentStage} TO ${nextStage}`);

    return NextResponse.json({
      success: true,
      message: `PO ${poNumber} successfully advanced to ${nextStage}`,
      poNumber: poNumber,
      newStage: nextStage
    }, { status: 200 });

  } catch (error: any) {
    console.error("--> ADVANCE STAGE API ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
