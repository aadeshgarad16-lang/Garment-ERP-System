import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { resolveGarmentSleeve } from '@/utils/bomValidation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.trim() || '';
    const sizes = searchParams.get('sizes') || ''; 
    const orderQuantity = parseInt(searchParams.get('orderQuantity') || '1', 10);
    const requestedSleeve = searchParams.get('sleeveType')?.trim() || searchParams.get('sleeve_type')?.trim() || searchParams.get('sleeve')?.trim() || '';
    let rawPoNumber = searchParams.get('poNumber') || '';
    let poNumber = decodeURIComponent(rawPoNumber).replace(/^PO:\s*/i, '').split('|')[0].trim();

    console.log("[BOM API] Searching calculations for PO:", poNumber);

    if (!poNumber || poNumber === '') {
      return NextResponse.json({ success: true, garmentSpecs: null, materials: [], message: 'No PO Number provided' }, { status: 200 });
    }

    let resolvedSleeve: string;
    try {
      resolvedSleeve = resolveGarmentSleeve(category || 'Shirt', requestedSleeve || 'half_sleeve');
    } catch (e: any) {
      return NextResponse.json({ success: false, garmentSpecs: null, materials: [], message: e.message }, { status: 200 });
    }

    let sizeArray: string[] = [];
    if (sizes) {
      try {
        sizeArray = JSON.parse(sizes);
      } catch (e) {
        sizeArray = sizes.split(',').map(s => s.trim());
      }
    }

    // Fetch Garment Specs
    let garmentSpecs: any = null;
    try {
      const specsQuery = `
        SELECT po.po_number, s.item_description, s.pattern, s.size, s.quantity, s.sleeve_type
        FROM purchase_orders po
        JOIN specifications s ON po.po_number = s.po_number
        WHERE po.po_number = ? LIMIT 1
      `;
      const [specsRows]: any = await pool.query(specsQuery, [poNumber]);
      if (specsRows && specsRows.length > 0) {
        const spec = specsRows[0];
        garmentSpecs = {
          garmentName: spec.item_description || category || 'Garment',
          subTitle: spec.pattern || 'Uniform',
          sizes: spec.size ? `Size: ${spec.size}` : `Size: ${sizeArray.join(', ')}`,
          totalQty: spec.quantity || orderQuantity,
          sleeveType: spec.sleeve_type || requestedSleeve || resolvedSleeve
        };
      } else {
         // Fallback garment specs if specs missing for PO
         garmentSpecs = {
            garmentName: category || 'Garment',
            subTitle: 'Standard Uniform',
            sizes: sizeArray.length > 0 ? `Size: ${sizeArray.join(', ')}` : 'Size: Standard',
            totalQty: orderQuantity,
            sleeveType: requestedSleeve || resolvedSleeve
         };
      }
    } catch (dbError: any) {
      console.error('Database query error (specs):', dbError);
      return NextResponse.json({ success: false, garmentSpecs: null, materials: [], message: 'Database error occurred while fetching specs.' }, { status: 200 });
    }

    // Fetch Materials
    let rows: any = [];
    try {
      const bomQuery = `
        SELECT gbc.* 
        FROM garment_bom_calculations gbc
        JOIN specifications s ON (gbc.item_name = s.fabric_type OR gbc.item_name = s.item_description)
        WHERE s.po_number = ? LIMIT 1
      `;
      [rows] = await pool.query(bomQuery, [poNumber]);
      
      // FALLBACK LOGIC: If no specific PO mapping is found, grab the default template for the category
      if (!rows || rows.length === 0) {
        let fallbackCategory = category || 'Shirt';
        if (garmentSpecs && garmentSpecs.garmentName) {
           fallbackCategory = garmentSpecs.garmentName;
        }
        const fallbackQuery = 'SELECT * FROM garment_bom_calculations WHERE item_name = ? LIMIT 1';
        [rows] = await pool.query(fallbackQuery, [fallbackCategory]);
      }
    } catch (dbError: any) {
      console.error('Database query error (bom):', dbError);
      return NextResponse.json({ success: false, garmentSpecs, materials: [], message: 'Database error occurred while fetching BOM calculations.' }, { status: 200 });
    }
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, garmentSpecs, materials: [], message: 'No materials found for this PO.' }, { status: 200 });
    }

    const row = rows[0];
    const materials = [];
    
    const materialMapping = [
      { key: 'fabric', name: 'Fabric', val: resolvedSleeve.toLowerCase().includes('half') ? row.fabric_half_sleeve : row.fabric_full_sleeve },
      { key: 'cuff', name: 'Cuff', val: row.cuff },
      { key: 'thread', name: 'Thread', val: row.thread },
      { key: 'collar', name: 'Collar', val: row.collar },
      { key: 'placket', name: 'Placket', val: row.placket },
      { key: 'size_label', name: 'Size Label', val: row.size_label },
      { key: 'washcare_label', name: 'Washcare Label', val: row.washcare_label },
      { key: 'overlock_thread', name: 'Overlock Thread', val: row.overlock_thread },
      { key: 'main_label', name: 'Main Label', val: row.main_label },
      { key: 'brand_label', name: 'Brand Label', val: row.brand_label },
      { key: 'polybag', name: 'Polybag', val: row.polybag },
      { key: 'box', name: 'Box', val: row.box },
      { key: 'clip', name: 'Clip', val: row.clip }
    ];

    let matId = 1;
    for (const m of materialMapping) {
       if (m.val !== undefined && m.val !== null && String(m.val).trim() !== '') {
          materials.push({
             id: matId++,
             materialInventory: m.name,
             brand: '',
             selectedSizes: garmentSpecs.sizes.replace('Size: ', ''),
             perPieceQty: parseFloat(String(m.val)) || 0,
             unitPrice: 0,
             wastageMargin: 5
          });
       }
    }

    return NextResponse.json({ success: true, garmentSpecs, materials });

  } catch (error: any) {
    console.error('Error calculating BOM:', error);
    return NextResponse.json({ success: false, materials: [], message: error.message || 'Internal Server Error' }, { status: 200 });
  }
}
