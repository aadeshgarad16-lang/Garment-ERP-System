import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const [rows]: any = await pool.query(`
      SELECT 
        user_id as id,
        full_name,
        username,
        role,
        email_id as email,
        last_login,
        status,
        created_at,
        modules_access,
        contact_number
      FROM users
      WHERE user_id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    
    // Parse modules if it's a string, assuming it might be JSON stringified
    let parsedModules = user.modules_access;
    if (typeof parsedModules === 'string') {
      try {
        parsedModules = JSON.parse(parsedModules);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employeeId: user.contact_number,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        email: user.email,
        mobileNumber: user.contact_number || user.username,
        lastLogin: user.last_login || "Never",
        modules: parsedModules || [],
        designation: user.designation || "",
        status: user.status || "Active",
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Fetch User Details Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
