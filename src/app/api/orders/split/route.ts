import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Order stage transition split received for:", body.poNumber || 'Unknown PO');
    
    // Simulate updating po_status / active stage in the database
    return NextResponse.json({ 
      success: true, 
      message: "PO stage updated successfully" 
    });
  } catch (err: any) {
    console.error("Error in /api/orders/split:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
