import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    categories: ['Fabric', 'Thread', 'Accessories', 'Packing'],
    genders: ['Men', 'Women', 'Unisex', 'Kids'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colours: ['Red', 'Blue', 'Green', 'Black', 'White', 'Navy']
  });
}
