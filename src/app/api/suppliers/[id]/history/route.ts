import { NextResponse } from 'next/server';

const MOCK_SUPPLIERS = [
  { id: "v1", name: "Apex Textiles Ltd" },
  { id: "v2", name: "Global Threads & Yarns" },
  { id: "v3", name: "Supreme Trims Co." },
  { id: "v4", name: "Vardhman Yarns" },
  { id: "v5", name: "Reliable Buttons & Zippers" }
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find supplier from mock data or use generic
    let supplierName = "Unknown Supplier";
    const foundSupplier = MOCK_SUPPLIERS.find(s => s.id === id || s.name.toLowerCase().includes(id.toLowerCase()));
    
    if (foundSupplier) {
      supplierName = foundSupplier.name;
    } else {
      // If passing name directly in ID for mock purposes
      supplierName = decodeURIComponent(id);
    }

    // Generate mock general info
    const generalInfo = {
      businessName: supplierName,
      contactPerson: "Rajesh Kumar",
      email: `contact@${supplierName.replace(/\s+/g, '').toLowerCase()}.com`,
      phone: "+91 98765 43210",
      address: "123 Industrial Area, Phase II, Mumbai, Maharashtra 400001",
      gstId: "27AABCT" + Math.floor(1000 + Math.random() * 9000) + "J1Z5",
      paymentTerms: "Net 30 Days"
    };

    // Generate mock history based on the supplier name to make it look realistic
    const history = [
      {
        id: "ART-101",
        articleName: "Premium Cotton Denim (Blue)",
        hsnCode: "520942",
        totalQty: 2500,
        unitPrice: 450,
        returnedQty: 50,
        returnReason: "Color bleeding defect",
        returnDate: "2026-05-12",
        netQty: 2450,
        netSpend: 2450 * 450
      },
      {
        id: "ART-102",
        articleName: "Polyester Blended Thread",
        hsnCode: "520411",
        totalQty: 1000,
        unitPrice: 120,
        returnedQty: 0,
        returnReason: null,
        returnDate: null,
        netQty: 1000,
        netSpend: 1000 * 120
      },
      {
        id: "ART-103",
        articleName: "Metal Zippers (YKK 5 inch)",
        hsnCode: "960711",
        totalQty: 5000,
        unitPrice: 15,
        returnedQty: 200,
        returnReason: "Teeth misalignment",
        returnDate: "2026-06-20",
        netQty: 4800,
        netSpend: 4800 * 15
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        id,
        generalInfo,
        history
      }
    });

  } catch (error) {
    console.error("Supplier history fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch supplier history" }, { status: 500 });
  }
}
