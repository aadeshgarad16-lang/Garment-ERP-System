import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier_name = searchParams.get('supplier_name');
    const supplier_id = searchParams.get('supplier_id');

    if (!supplier_name && !supplier_id) {
      return NextResponse.json(
        { success: false, error: 'Please provide supplier_name or supplier_id parameter' },
        { status: 400 }
      );
    }

    // Try to query using the exact columns requested
    // Fallback aliases are used in case the columns are named as in the v1 creation endpoint
    let query = `
      SELECT 
        id as supplier_id, 
        company_name as supplier_name, 
        registered_address as regestired_address, 
        gstin_tax_id as gstin, 
        email_address as email 
      FROM supplier_info 
    `;
    
    // In case the DB actually has the columns exactly as the user's SQL example:
    const exactQuery = `
      SELECT supplier_id, supplier_name, regestired_address, gstin, email 
      FROM Supplier_Info 
    `;

    // We will try the exactQuery first, if it fails, we fall back to the v1 columns mapping
    const params: string[] = [];
    let whereClause = '';

    if (supplier_name) {
      whereClause = ` WHERE supplier_name = ?`;
      params.push(supplier_name);
    } else if (supplier_id) {
      whereClause = ` WHERE supplier_id = ?`;
      params.push(supplier_id);
    }

    let rows: RowDataPacket[] = [];

    try {
      [rows] = await pool.execute<RowDataPacket[]>(exactQuery + whereClause, params);
    } catch (err: any) {
      // Fallback if columns like supplier_name don't exist and instead it's company_name
      let fallbackWhere = '';
      if (supplier_name) {
        fallbackWhere = ` WHERE company_name = ?`;
      } else if (supplier_id) {
        fallbackWhere = ` WHERE id = ?`;
      }
      [rows] = await pool.execute<RowDataPacket[]>(query + fallbackWhere, params);
    }

    if (!rows || rows.length === 0) {
      // 3. ERROR HANDLING & EDGE CASES: Return 200 OK with empty address if no vendor is found
      return NextResponse.json({
        success: true,
        data: {
          supplier_name: supplier_name || "",
          regestired_address: "",
          gstin: "",
          email: ""
        }
      });
    }

    const supplier = rows[0];

    return NextResponse.json({
      success: true,
      data: {
        supplier_name: supplier.supplier_name || supplier_name || "",
        regestired_address: supplier.regestired_address || "",
        gstin: supplier.gstin || "",
        email: supplier.email || ""
      }
    });

  } catch (error) {
    console.error('Error fetching supplier address:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
