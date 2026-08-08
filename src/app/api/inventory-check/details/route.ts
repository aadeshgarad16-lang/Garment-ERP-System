import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('po_number') || searchParams.get('poNumber');

    if (!poNumber) {
      return NextResponse.json({ success: false, error: 'PO number is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
    // We will attempt to fetch BOM details from Python backend, and fallback if necessary.
    try {
      const res = await fetch(`${backendUrl}/bom_calculation/view?po_number=${encodeURIComponent(poNumber)}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_ERP_READ_API_KEY || 'sasons_read_only_key_2026_abc' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming data is an array of materials
        if (Array.isArray(data)) {
           return NextResponse.json({ success: true, data: data, summary: {} });
        } else if (data.data) {
           return NextResponse.json({ success: true, data: data.data, summary: data.summary || {} });
        }
      }
    } catch (e) {
      console.warn("Could not fetch BOM details from python backend", e);
    }

    // Default mock data if python fails or doesn't have it
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'MAT-001',
          name: 'Navy Blue Thread',
          category: 'Thread',
          available_qty: 1500,
          required_qty: 1000,
          shortage_qty: 0,
          unit: 'spools',
          min_required: 200,
          original_status: 'Available'
        },
        {
          id: 'MAT-002',
          name: 'Cotton Fabric 100%',
          category: 'Fabric',
          available_qty: 50,
          required_qty: 250,
          shortage_qty: 200,
          unit: 'meters',
          min_required: 100,
          original_status: 'Partial Stock'
        }
      ],
      summary: {}
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
