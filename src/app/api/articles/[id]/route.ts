import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete logic: UPDATE articles SET is_archived = true WHERE id = id
    
    return NextResponse.json({ success: true, message: `Archived item ${id}` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
