import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// Helper to verify Werkzeug scrypt hash
function verifyScryptHash(hashString: string, password: string): boolean {
  try {
    if (!hashString.startsWith('scrypt:')) {
      return hashString === password;
    }
    const parts = hashString.split('$');
    const params = parts[0].split(':');
    const salt = parts[1];
    const hash = parts[2];

    const N = parseInt(params[1], 10);
    const r = parseInt(params[2], 10);
    const p = parseInt(params[3], 10);

    const derivedKey = crypto.scryptSync(password, salt, 64, { N, r, p });
    const derivedKeyHex = derivedKey.toString('hex');
    return derivedKeyHex === hash;
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    let body = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {}

    // Extract input identifier and password cleanly
    const inputIdentifier = (
      (body as any).contactNumber || 
      (body as any).contact_number || 
      (body as any).userId || 
      (body as any).user_id || 
      (body as any).phone || 
      (body as any).username || 
      (body as any).email || 
      ''
    ).toString().trim();

    const inputPassword = (
      (body as any).password || 
      (body as any).pass || 
      (body as any).pwd || 
      ''
    ).toString().trim();

    console.log("=================== AUTHENTICATION DEBUG ===================");
    console.log("--> SUBMITTED IDENTIFIER:", inputIdentifier);

    if (!inputIdentifier || !inputPassword) {
      return NextResponse.json({ success: false, message: 'Missing Contact Number or Password' }, { status: 400 });
    }

    // STEP 1: Query user record by identifier WITHOUT matching password in SQL
    // Using actual schema columns to prevent SQL crashes (contact_number, user_id, username, email_id)
    const [rows]: any = await pool.query(
      `SELECT * FROM users 
       WHERE TRIM(CAST(contact_number AS CHAR)) = ? 
          OR TRIM(CAST(user_id AS CHAR)) = ? 
          OR TRIM(CAST(username AS CHAR)) = ? 
          OR TRIM(CAST(email_id AS CHAR)) = ?`,
      [inputIdentifier, inputIdentifier, inputIdentifier, inputIdentifier]
    );

    if (!rows || rows.length === 0) {
      console.log("--> NO USER FOUND IN DB FOR:", inputIdentifier);
      return NextResponse.json({ success: false, message: 'Invalid User ID or Password' }, { status: 401 });
    }

    const user = rows[0];
    const dbPassword = (user.password_hash || user.password || user.pass || user.pwd || '').toString().trim();

    // STEP 2: Compare Password (Plaintext OR Scrypt/Bcrypt hash support)
    let isPasswordValid = (dbPassword === inputPassword);
    
    // Scrypt check
    if (!isPasswordValid && dbPassword.startsWith('scrypt:')) {
      isPasswordValid = verifyScryptHash(dbPassword, inputPassword);
    }

    // Bcrypt check
    if (!isPasswordValid && dbPassword.startsWith('$2')) {
      try {
        const bcrypt = require('bcryptjs');
        isPasswordValid = await bcrypt.compare(inputPassword, dbPassword);
      } catch (err) {
        console.warn("bcryptjs not found, skipping bcrypt fallback");
      }
    }

    if (!isPasswordValid) {
      console.log(`--> PASSWORD MISMATCH FOR USER ${inputIdentifier}`);
      return NextResponse.json({ success: false, message: 'Invalid User ID or Password' }, { status: 401 });
    }

    console.log("--> AUTHENTICATION SUCCESSFUL FOR:", user.name || user.username || user.full_name || inputIdentifier);

    // STEP 3: Set auth cookie for Middleware Route Protection
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id || user.user_id,
        name: user.name || user.username || user.full_name || 'User',
        role: user.role || 'Admin',
        contactNumber: user.contact_number || inputIdentifier
      }
    }, { status: 200 });

    response.cookies.set({
      name: 'auth_token',
      value: 'true',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return response;

  } catch (error: any) {
    console.error("--> LOGIN CRITICAL EXCEPTION:", error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during authentication.',
      error: error.message
    }, { status: 500 });
  }
}
