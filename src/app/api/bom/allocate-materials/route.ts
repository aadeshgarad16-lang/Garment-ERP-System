import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poNumber, allocations } = body;

    if (!poNumber) {
      return NextResponse.json({ error: 'poNumber is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let hasShortage = false;

      for (const alloc of allocations || []) {
        const materialId = alloc.material_id;
        const allocateQty = parseFloat(alloc.allocate_qty || 0);
        const shortageQty = parseFloat(alloc.shortage_qty || 0);

        if (!materialId) continue;

        if (allocateQty > 0) {
          await connection.query(
            `UPDATE store_materials 
             SET available_qty = GREATEST(0, available_qty - ?),
                 blocked_qty = COALESCE(blocked_qty, 0) + ?,
                 total_price = GREATEST(0, available_qty - ?) * unit_price
             WHERE material_id = ?`,
            [allocateQty, allocateQty, allocateQty, materialId]
          );
        }

        if (shortageQty > 0) {
          hasShortage = true;
          const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT procurement_id FROM procurement WHERE po_number = ? AND material_id = ?`,
            [poNumber, materialId]
          );

          if (rows.length > 0) {
            await connection.query(
              `UPDATE procurement SET required_qty = ?, status = 'Pending Procurement' WHERE po_number = ? AND material_id = ?`,
              [shortageQty, poNumber, materialId]
            );
          } else {
            await connection.query(
              `INSERT INTO procurement (po_number, material_id, required_qty, supplier_name, status, supplier_contact, invoice_number)
               VALUES (?, ?, ?, 'Auto Assigned (Shortage)', 'Pending Procurement', '', '')`,
              [poNumber, materialId, shortageQty]
            );
          }
        }
        
        // Update BOM allocation status
        await connection.query(
          `UPDATE bill_of_materials SET allocation_status = ? WHERE po_number = ? AND material_id = ?`,
          [shortageQty > 0 ? 'Shortage' : 'Allocated', poNumber, materialId]
        );
      }

      const nextStage = hasShortage ? 'Procurement' : 'Production';
      
      await connection.query(
        `UPDATE purchase_orders SET stage = ? WHERE po_number = ?`,
        [nextStage, poNumber]
      );

      await connection.commit();
      return NextResponse.json({ 
        success: true, 
        next_stage: nextStage,
        message: `Materials allocated. Order advanced to ${nextStage}.` 
      });

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
