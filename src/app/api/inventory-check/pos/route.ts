import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
    // We could fetch from a local Python backend or return mock data.
    // Given we are replacing /api/inventory-check/pos, we'll try to fetch from Python backend and fallback to mock
    try {
      const res = await fetch(`${backendUrl}/purchase_orders/view`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_ERP_READ_API_KEY || 'sasons_read_only_key_2026_abc' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const pos = data.map((po: any) => ({
          po_number: po.po_number,
          customer_name: po.customer_name || 'Customer'
        }));
        return NextResponse.json({ success: true, pos });
      }
    } catch (e) {
      console.warn("Could not fetch POs from python backend, falling back to mock", e);
    }

    return NextResponse.json({
      success: true,
      pos: [
        { po_number: 'PO-SHIRT-2026', customer_name: 'Aadesh Apparel Co.' }
      ]
    });
  } catch (error) {
    return NextResponse.json({ success: false, pos: [] }, { status: 500 });
  }
}
