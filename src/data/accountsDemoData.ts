// src/data/accountsDemoData.ts

export const DEMO_SALES_POS = [
  {
    id: "PO-2026-0801",
    customer: "Reliance Retail Ltd",
    invDate: "15-07-2026",
    paymentTerm: "NET 30",
    dueDate: "05-08-2026",
    totalAmount: 450000,
    advancePaid: 450000,
    balanceDue: 0,
    status: "PAID", // Paid POs tab
    transactions: [
      { txId: "TXN-0891", date: "15-07-2026", mode: "Bank Transfer", amount: 200000 },
      { txId: "TXN-0912", date: "02-08-2026", mode: "Bank Transfer", amount: 250000 }
    ]
  },
  {
    id: "PO-2026-0802",
    customer: "Aditya Birla Fashion",
    invDate: "18-07-2026",
    paymentTerm: "NET 15",
    dueDate: "08-08-2026",
    totalAmount: 320000,
    advancePaid: 0,
    balanceDue: 320000,
    status: "UNPAID", // Unpaid POs tab
    transactions: []
  },
  {
    id: "PO-2026-0715",
    customer: "Raymond Apparel",
    invDate: "10-06-2026",
    paymentTerm: "NET 30",
    dueDate: "10-07-2026",
    totalAmount: 580000,
    advancePaid: 100000,
    balanceDue: 480000,
    status: "OVERDUE", // Overdue POs tab
    transactions: [
      { txId: "TXN-0750", date: "10-06-2026", mode: "UPI", amount: 100000 }
    ]
  }
];

export const DEMO_PROCUREMENT_POS = [
  {
    id: "PR-753228",
    po_number: "PR-753228",
    supplier: "Sumeet Trims & Accessories",
    supplier_name: "Sumeet Trims & Accessories",
    invDate: "01-07-2026",
    paymentTerm: "NET 30",
    dueDate: "01-08-2026",
    totalAmount: 109200,
    advancePaid: 109200,
    balanceDue: 0,
    status: "PAID",
    transactions: [{ txId: "TXN-PR-01", date: "01-08-2026", mode: "NEFT", amount: 109200 }],
    rawMaterials: [
      { name: "Cotton Fabric", type: "Fabric", color: "Navy Blue", quantity: 500, unit: "Mtrs", unitPrice: 150 }
    ],
    finishedGoods: [
      { name: "Classic Polo Shirt", sizes: "S: 10, M: 20, L: 15, XL: 5", color: "Black", totalQty: 50, unitPrice: 450 }
    ]
  },
  {
    id: "PR-857601",
    po_number: "PR-857601",
    supplier: "Apex Textiles Ltd.",
    supplier_name: "Apex Textiles Ltd.",
    invDate: "20-07-2026",
    paymentTerm: "NET 15",
    dueDate: "04-08-2026",
    totalAmount: 37520,
    advancePaid: 0,
    balanceDue: 37520,
    status: "UNPAID",
    transactions: [],
    rawMaterials: [
      { name: "Polyester Threads", type: "Trims", color: "White", quantity: 1000, unit: "Spools", unitPrice: 25 }
    ],
    finishedGoods: [
      { name: "Zipper Jackets", sizes: "M: 5, L: 5", color: "Grey", totalQty: 10, unitPrice: 850 }
    ]
  },
  {
    id: "PR-992014",
    po_number: "PR-992014",
    supplier: "Denim World",
    supplier_name: "Denim World",
    invDate: "05-08-2026",
    paymentTerm: "NET 30",
    dueDate: "05-09-2026",
    totalAmount: 67200,
    advancePaid: 20000,
    balanceDue: 47200,
    status: "PARTIALLY PAID",
    transactions: [{ txId: "TXN-PR-02", date: "05-08-2026", mode: "NEFT", amount: 20000 }],
    rawMaterials: [
      { name: "Denim Fabric", type: "Fabric", color: "Indigo", quantity: 200, unit: "Mtrs", unitPrice: 300 }
    ],
    finishedGoods: []
  }
];
