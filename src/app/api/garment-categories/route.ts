import { NextResponse } from 'next/server';

// Derive the default sleeve type from item name.
// Mirrors the same logic as the Flask backend derive_sleeve().
function deriveDefaultSleeve(itemName: string): string | null {
  const n = (itemName || '').toLowerCase();
  if (n.includes('shirt') && !n.includes('t-shirt')) return null;   // plain Shirt → manual
  if (n.includes('t-shirt') || n.includes('kurta') || n.includes('polo')) return 'half_sleeve';
  if (
    n.includes('pant') || n.includes('trouser') || n.includes('jacket') ||
    n.includes('blazer') || n.includes('salwar') || n.includes('dupatta') ||
    n.includes('boiler')
  ) return 'full_sleeve';
  return null; // unknown → keep manual
}

const STATIC_FALLBACK = [
  { itemName: 'Shirt',     defaultSleeve: null },
  { itemName: 'T-Shirt',   defaultSleeve: 'half_sleeve' },
  { itemName: 'Pant',      defaultSleeve: 'full_sleeve' },
  { itemName: 'Blazer',    defaultSleeve: 'full_sleeve' },
  { itemName: 'Jacket',    defaultSleeve: 'full_sleeve' },
  { itemName: 'Kurta',     defaultSleeve: 'half_sleeve' },
];

export async function GET() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  try {
    // ── Try to fetch from Flask first ──────────────────────────────────
    const res = await fetch(`${BACKEND_URL}/api/garment-categories`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      // If Flask already returns the shaped response, pass it through directly
      if (Array.isArray(data) && data.length > 0 && 'itemName' in data[0]) {
        return NextResponse.json(data);
      }
      // If Flask returns raw rows (just item_name strings) — normalise them
      if (Array.isArray(data)) {
        const shaped = data.map((row: any) => {
          const name: string = typeof row === 'string' ? row : (row.item_name || row.itemName || '');
          return {
            itemName: name,
            defaultSleeve: typeof row.defaultSleeve !== 'undefined'
              ? row.defaultSleeve
              : deriveDefaultSleeve(name),
          };
        });
        return NextResponse.json(shaped);
      }
    }
  } catch {
    // Flask offline — fall through to static fallback
  }

  // ── Fallback: try to query MySQL directly via the db pool ──────────
  try {
    const db = (await import('@/lib/db')).default;
    const [rows] = await db.query(
      'SELECT DISTINCT item_name FROM garment_bom_calculations ORDER BY item_name'
    ) as [any[], any];

    const shaped = (rows as any[]).map((row) => ({
      itemName: row.item_name as string,
      defaultSleeve: deriveDefaultSleeve(row.item_name),
    }));

    return NextResponse.json(shaped.length > 0 ? shaped : STATIC_FALLBACK);
  } catch (dbErr) {
    console.error('[garment-categories] DB fallback failed:', dbErr);
    return NextResponse.json(STATIC_FALLBACK);
  }
}
