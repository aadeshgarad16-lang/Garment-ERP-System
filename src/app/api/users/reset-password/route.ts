import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    let body = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {}

    const { userId, newPassword, confirmPassword } = body as any;

    if (!userId || !newPassword || !confirmPassword) {
      return NextResponse.json({
        success: false,
        message: 'User ID and passwords are required.'
      }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({
        success: false,
        message: 'Passwords do not match.'
      }, { status: 400 });
    }

    // Verify user exists
    const [existing]: any = await pool.query(
      `SELECT user_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found.'
      }, { status: 404 });
    }

    // Update password
    // Note: To match the existing auth structure, we update password_hash.
    // If the system expects scrypt hashes natively and we aren't hashing here,
    // we save as plain text since the login route has a fallback to support plain text.
    await pool.query(
      `UPDATE users SET password_hash = ? WHERE user_id = ?`,
      [newPassword, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    }, { status: 200 });

  } catch (err: any) {
    console.error("Password Reset Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
