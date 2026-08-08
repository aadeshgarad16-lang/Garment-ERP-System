import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, message: 'Garment added successfully', data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to add garment' }, { status: 500 });
  }
}
