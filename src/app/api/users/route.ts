import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [users]: any = await pool.query(`
      SELECT 
        user_id as id,
        COALESCE(NULL, CONCAT('EMP-', user_id)) AS employee_id,
        COALESCE(full_name, 'N/A') AS full_name,
        COALESCE(username, contact_number, 'N/A') AS username,
        COALESCE(role, 'User') AS role,
        COALESCE(email_id, 'N/A') AS email,
        COALESCE(last_login, NOW()) AS last_login,
        COALESCE(status, 'Active') AS status,
        created_at
      FROM users
      ORDER BY user_id DESC
    `);

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Users Directory Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    let body = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {}

    const {
      fullName,
      email,
      email_id,
      role,
      designation,
      username,
      contactNumber,
      password,
      permissions,
      modulesAccess
    } = body as any;

    const finalUsername = username || contactNumber;
    const finalEmail = email || email_id || '';
    const finalPermissions = permissions || modulesAccess || [];
    const finalDesignation = designation || role || 'Employee';

    if (!finalUsername || !password) {
      return NextResponse.json({
        success: false,
        message: 'Username/Contact Number and Password are required.'
      }, { status: 400 });
    }

    // Check for duplicate username/contact number
    const [existing]: any = await pool.query(
      `SELECT user_id FROM users WHERE username = ? OR contact_number = ?`,
      [finalUsername, finalUsername]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'User with this Username / Contact Number already exists.'
      }, { status: 400 });
    }

    // Insert new user record
    // Note: Schema adapted to match actual sasons_erp.users structure
    const [result]: any = await pool.query(
      `INSERT INTO users 
        (full_name, email_id, role, designation, username, contact_number, password_hash, modules_access, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW())`,
      [
        fullName || 'New User',
        finalEmail,
        role || 'Viewer',
        finalDesignation,
        finalUsername,
        finalUsername, // Map username input to contact_number column
        password, // Stored as plain text; supported by login fallback
        JSON.stringify(finalPermissions)
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    }, { status: 201 });

  } catch (err: any) {
    console.error("Create User Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
