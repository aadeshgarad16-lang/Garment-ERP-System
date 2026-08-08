import { NextResponse } from 'next/server';

function notFoundResponse() {
  return NextResponse.json(
    { success: false, message: 'API route not found' },
    { status: 404 }
  );
}

export async function GET() {
  return notFoundResponse();
}

export async function POST() {
  return notFoundResponse();
}

export async function PUT() {
  return notFoundResponse();
}

export async function DELETE() {
  return notFoundResponse();
}

export async function PATCH() {
  return notFoundResponse();
}
