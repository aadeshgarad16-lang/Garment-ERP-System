// src/data/centralProcurementStore.ts

export const MASTER_PROCUREMENT_POS = [
  // 1. ACTIVE PO / UNPAID IN ACCOUNTS
  {
    id: "PO-PROC-2026-01",
    poNumber: "PR-857601",
    supplier: "Apex Textiles Ltd.",
    orderDate: "2026-08-02",
    deliveryDate: "2026-08-20",
    invoiceDate: "2026-08-03",
    paymentTerm: "NET 15",
    dueDate: "2026-08-18",
    status: "IN_PROCESS", // Active PO in Procurement & Store
    paymentStatus: "UNPAID", // Accounts Unpaid tab
    totalItems: 350,
    rawMaterials: [
      { name: "100% Cotton Denim 14oz", type: "Fabric", color: "Indigo Blue", quantity: 300, unitPrice: 320 } // ₹96,000
    ],
    finishedGoods: [
      { style: "Denim Jacket Type III", sizes: "S: 10, M: 20, L: 15, XL: 5", color: "Dark Wash", totalQty: 50, unitPrice: 850 } // ₹42,500
    ],
    subtotal: 138500,
    gstAmount: 16620, // 12% GST
    grandTotal: 155120,
    advancePaid: 0,
    balanceDue: 155120,
    transactions: []
  },

  // 2. ACTIVE PO / OVERDUE IN ACCOUNTS
  {
    id: "PO-PROC-2026-02",
    poNumber: "PR-992014",
    supplier: "Denim World Suppliers",
    orderDate: "2026-07-15",
    deliveryDate: "2026-08-10",
    invoiceDate: "2026-07-16",
    paymentTerm: "NET 15",
    dueDate: "2026-07-31",
    status: "IN_PROCESS", // Active PO in Procurement & Store
    paymentStatus: "OVERDUE", // Accounts Overdue tab
    totalItems: 1200,
    rawMaterials: [
      { name: "Heavy Duty Brass Rivets", type: "Hardware", color: "Antique Brass", quantity: 1200, unitPrice: 15 } // ₹18,000
    ],
    finishedGoods: [],
    subtotal: 18000,
    gstAmount: 2160,
    grandTotal: 20160,
    advancePaid: 0,
    balanceDue: 20160,
    transactions: []
  },

  // 3. COMPLETED PO / PAID IN ACCOUNTS
  {
    id: "PO-PROC-2026-03",
    poNumber: "PR-753228",
    supplier: "Sumeet Trims & Accessories",
    orderDate: "2026-07-01",
    deliveryDate: "2026-07-25",
    invoiceDate: "2026-07-02",
    paymentTerm: "NET 30",
    dueDate: "2026-08-01",
    status: "COMPLETED", // Completed PO in Procurement & Store
    paymentStatus: "PAID", // Accounts Paid tab
    totalItems: 500,
    rawMaterials: [
      { name: "YKK Metal Zippers #5", type: "Trims", color: "Matte Black", quantity: 500, unitPrice: 45 } // ₹22,500
    ],
    finishedGoods: [
      { style: "Slim Fit Chinos", sizes: "S: 15, M: 25, L: 20", color: "Khaki", totalQty: 60, unitPrice: 600 } // ₹36,000
    ],
    subtotal: 58500,
    gstAmount: 7020,
    grandTotal: 65520,
    advancePaid: 65520,
    balanceDue: 0,
    transactions: [{ txId: "TXN-8812", date: "2026-07-28", mode: "NEFT", amount: 65520 }]
  },

  // 4. COMPLETED PO / PARTIALLY PAID IN ACCOUNTS
  {
    id: "PO-PROC-2026-04",
    poNumber: "PR-014889",
    supplier: "Vardhman Yarns & Threads",
    orderDate: "2026-07-10",
    deliveryDate: "2026-08-01",
    invoiceDate: "2026-07-11",
    paymentTerm: "NET 30",
    dueDate: "2026-08-11",
    status: "COMPLETED", // Completed PO in Procurement & Store
    paymentStatus: "PARTIALLY_PAID", // Accounts Unpaid/Partial tab
    totalItems: 800,
    rawMaterials: [
      { name: "Polyester Thread Spools 5000m", type: "Thread", color: "Pure White", quantity: 200, unitPrice: 180 } // ₹36,000
    ],
    finishedGoods: [
      { style: "Classic Crewneck Sweatshirt", sizes: "S: 20, M: 40, L: 30, XL: 10", color: "Melange Grey", totalQty: 100, unitPrice: 450 } // ₹45,000
    ],
    subtotal: 81000,
    gstAmount: 9720,
    grandTotal: 90720,
    advancePaid: 40000,
    balanceDue: 50720,
    transactions: [{ txId: "TXN-9015", date: "2026-07-20", mode: "UPI", amount: 40000 }]
  },

  // 5. COMPLETED PO / PAID IN ACCOUNTS
  {
    id: "PO-PROC-2026-05",
    poNumber: "PR-610492",
    supplier: "Coats India Buttons & Fasteners",
    orderDate: "2026-06-20",
    deliveryDate: "2026-07-15",
    invoiceDate: "2026-06-21",
    paymentTerm: "NET 30",
    dueDate: "2026-07-21",
    status: "COMPLETED",
    paymentStatus: "PAID",
    totalItems: 2500,
    rawMaterials: [
      { name: "Horn Buttons 20mm", type: "Buttons", color: "Dark Brown", quantity: 2500, unitPrice: 12 } // ₹30,000
    ],
    finishedGoods: [],
    subtotal: 30000,
    gstAmount: 3600,
    grandTotal: 33600,
    advancePaid: 33600,
    balanceDue: 0,
    transactions: [{ txId: "TXN-7740", date: "2026-07-18", mode: "Bank Transfer", amount: 33600 }]
  }
];
