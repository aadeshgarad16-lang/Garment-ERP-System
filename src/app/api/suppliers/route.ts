import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate database insertion delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate a mock ID
    const newId = `v${Math.floor(Math.random() * 1000) + 10}`;
    
    const newSupplier = {
      id: newId,
      name: body.companyName || "Unknown Supplier",
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email,
      address: body.address,
      gstId: body.gstin,
      paymentTerms: body.paymentTerms,
      rawMaterials: body.rawMaterials || [],
      finishedGoods: body.finishedGoods || []
    };

    return NextResponse.json({
      success: true,
      message: "Supplier created successfully",
      data: newSupplier
    });

  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}
