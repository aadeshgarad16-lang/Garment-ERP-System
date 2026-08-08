import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    categories: ['Shirts', 'Trousers', 'Jackets', 'Accessories'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Grey']
  });
}
