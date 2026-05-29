const fs = require('fs');
const file = 'c:/Users/USER/Downloads/Sason_Project/garment-erp-system/src/app/(dashboard)/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Dark mode replacements
content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
content = content.replace(/border-neutral-200/g, 'border-neutral-200 dark:border-slate-700');
content = content.replace(/border-neutral-300/g, 'border-neutral-300 dark:border-slate-600');
content = content.replace(/text-neutral-900/g, 'text-neutral-900 dark:text-neutral-100');
content = content.replace(/text-neutral-800/g, 'text-neutral-800 dark:text-neutral-200');
content = content.replace(/text-neutral-700/g, 'text-neutral-700 dark:text-neutral-300');
content = content.replace(/text-neutral-500/g, 'text-neutral-500 dark:text-neutral-400');
content = content.replace(/text-black/g, 'text-black dark:text-white');
content = content.replace(/bg-neutral-50\/50/g, 'bg-neutral-50/50 dark:bg-slate-800/50');
content = content.replace(/bg-neutral-50/g, 'bg-neutral-50 dark:bg-slate-800/80');
content = content.replace(/bg-blue-50/g, 'bg-blue-50 dark:bg-indigo-900/50');
content = content.replace(/text-blue-600/g, 'text-blue-600 dark:text-indigo-400');
content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-gray-100');
content = content.replace(/caret-black/g, 'caret-black dark:caret-white');
content = content.replace(/hover:bg-blue-100/g, 'hover:bg-blue-100 dark:hover:bg-indigo-900/80');

// Fix input styles for dark mode inline color
content = content.replace(/style={{ color: "#111827" }}/g, '');

// i18n hook insertion
if (!content.includes('useTranslation')) {
  content = content.replace(/import { useState } from "react";/, 'import { useState } from "react";\nimport { useTranslation } from "@/hooks/useTranslation";');
  content = content.replace(/export default function OrdersPage\(\) \{/, 'export default function OrdersPage() {\n  const { t } = useTranslation();');
}

// i18n Text Replacements
// Headers
content = content.replace(/>\s*Order Initiation\s*<\/h1>/g, '>{t("orderInitiation.header.title") || "Order Initiation"}</h1>');
content = content.replace(/>\s*Create and manage purchase orders\s*<\/p>/g, '>{t("orderInitiation.header.description") || "Create and manage purchase orders"}</p>');

content = content.replace(/>\s*Purchase Order Information\s*<\/h2>/g, '>{t("orderInitiation.purchaseOrderInfo.title") || "Purchase Order Information"}</h2>');
content = content.replace(/>\s*Purchase Order Number \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.poNumber") || "Purchase Order Number"} *</label>');
content = content.replace(/>\s*Customer Name \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.customerName") || "Customer Name"} *</label>');
content = content.replace(/>\s*PO Date \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.poDate") || "PO Date"} *</label>');
content = content.replace(/>\s*Delivery Date \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.deliveryDate") || "Delivery Date"} *</label>');
content = content.replace(/>\s*Contact Person Name\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.contactPerson") || "Contact Person Name"}</label>');
content = content.replace(/>\s*Phone Number\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.phoneNumber") || "Phone Number"}</label>');
content = content.replace(/>\s*Email ID\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.emailId") || "Email ID"}</label>');
content = content.replace(/>\s*Delivery Address \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.deliveryAddress") || "Delivery Address"} *</label>');
content = content.replace(/>\s*Delivery Address \(PIN\) \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.deliveryAddressPin") || "Delivery Address (PIN)"} *</label>');
content = content.replace(/>\s*Bill \/ Invoice To \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.billTo") || "Bill / Invoice To"} *</label>');
content = content.replace(/>\s*Billing Address \(PIN\)\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.billingAddressPin") || "Billing Address (PIN)"}</label>');
content = content.replace(/>\s*Billing Address\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.billingAddress") || "Billing Address"}</label>');
content = content.replace(/>\s*GST Reg No \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.gstRegNo") || "GST Reg No"} *</label>');
content = content.replace(/>\s*CIN \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.cin") || "CIN"} *</label>');
content = content.replace(/>\s*Test Certificate Required\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.testCertificate") || "Test Certificate Required"}</label>');
content = content.replace(/>\s*Transport Cost\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.transportCost") || "Transport Cost"}</label>');
content = content.replace(/>\s*PO File \*\s*<\/label>/g, '>{t("orderInitiation.purchaseOrderInfo.poFile") || "PO File"} *</label>');
content = content.replace(/>\s*Upload PO File\s*<\/span>/g, '>{t("orderInitiation.purchaseOrderInfo.uploadPoFile") || "Upload PO File"}</span>');
content = content.replace(/>\s*PDF, DOCX, XLS, PNG, JPG up to 10MB\s*<\/span>/g, '>{t("orderInitiation.purchaseOrderInfo.uploadConstraints") || "PDF, DOCX, XLS, PNG, JPG up to 10MB"}</span>');

content = content.replace(/>\s*Payment Details\s*<\/h2>/g, '>{t("orderInitiation.paymentDetails.title") || "Payment Details"}</h2>');
content = content.replace(/>\s*Payment Term\s*<\/label>/g, '>{t("orderInitiation.paymentDetails.paymentTerm") || "Payment Term"}</label>');
content = content.replace(/>\s*Select term\.\.\.\s*<\/option>/g, '>{t("orderInitiation.paymentDetails.selectTerm") || "Select term..."}</option>');
content = content.replace(/>\s*PO Amount \*\s*<\/label>/g, '>{t("orderInitiation.paymentDetails.poAmount") || "PO Amount"} *</label>');
content = content.replace(/>\s*Advance Amount\s*<\/label>/g, '>{t("orderInitiation.paymentDetails.advanceAmount") || "Advance Amount"}</label>');
content = content.replace(/>\s*Subtotal\s*<\/span>/g, '>{t("orderInitiation.paymentDetails.subtotal") || "Subtotal"}</span>');
content = content.replace(/>\s*Tax \(0\%\)\s*<\/span>/g, '>{t("orderInitiation.paymentDetails.tax") || "Tax (0%)"}</span>');
content = content.replace(/>\s*Total Amount\s*<\/span>/g, '>{t("orderInitiation.paymentDetails.totalAmount") || "Total Amount"}</span>');

content = content.replace(/>\s*Garment Specifications\s*<\/h2>/g, '>{t("orderInitiation.garmentSpecifications.title") || "Garment Specifications"}</h2>');
content = content.replace(/>\s*Add Row\s*<\/button>/, '>{t("orderInitiation.garmentSpecifications.addRow") || "Add Row"}</button>');
content = content.replace(/>Item Description<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.itemDescription") || "Item Description"}</th>');
content = content.replace(/>Size<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.size") || "Size"}</th>');
content = content.replace(/>Quantity<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.quantity") || "Quantity"}</th>');
content = content.replace(/>Unit Price<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.unitPrice") || "Unit Price"}</th>');
content = content.replace(/>Pattern<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.pattern") || "Pattern"}</th>');
content = content.replace(/>Upload Photo<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.uploadPhoto") || "Upload Photo"}</th>');
content = content.replace(/>Action<\/th>/g, '>{t("orderInitiation.garmentSpecifications.table.action") || "Action"}</th>');

content = content.replace(/>\s*Save as Draft\s*<\/button>/, '>{t("orderInitiation.footer.saveDraft") || "Save as Draft"}</button>');
content = content.replace(/>\s*View Drafts\s*<\/button>/, '>{t("orderInitiation.footer.viewDrafts") || "View Drafts"}</button>');
content = content.replace(/>\s*Submit Order\s*<\/button>/, '>{t("orderInitiation.footer.submitOrder") || "Submit Order"}</button>');
content = content.replace(/>\s*Go to Stock Calculation →\s*<\/button>/, '>{t("orderInitiation.footer.goToStockCalculation") || "Go to Stock Calculation →"}</button>');

fs.writeFileSync(file, content);
console.log('Script completed');
