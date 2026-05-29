const fs = require('fs');
const file = 'c:/Users/USER/Downloads/Sason_Project/garment-erp-system/src/app/(dashboard)/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add useEffect to imports
if (!content.includes('useEffect')) {
  content = content.replace(/import React, { useState } from "react";/, 'import React, { useState, useEffect } from "react";');
}

// 2. Add state for form fields inside OrdersPage
const stateInjection = `
  const [formData, setFormData] = useState({
    poNumber: "",
    customerName: "",
    poDate: "",
    deliveryDate: "",
    contactPerson: "",
    phoneNumber: "",
    emailId: "",
    deliveryAddress: "",
    deliveryPinCode: "",
    billTo: "",
    billingPinCode: "",
    billingAddress: "",
    gstRegNo: "",
    cin: "",
    testCertificate: "Yes",
    transportCost: "Paid by Customer",
    paymentTerm: "Select term...",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const draftStr = localStorage.getItem('orderInitiationDraft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setFormData({
          poNumber: draft.poInfo?.poNumber || draft.poNumber || "",
          customerName: draft.poInfo?.customerName || draft.customerName || "",
          poDate: draft.poInfo?.poDate || draft.poDate || "",
          deliveryDate: draft.poInfo?.deliveryDate || draft.deliveryDate || "",
          contactPerson: draft.poInfo?.billingContact || draft.billingContact || "",
          phoneNumber: draft.poInfo?.phoneNumber || "",
          emailId: draft.poInfo?.billingEmail || draft.billingEmail || "",
          deliveryAddress: draft.poInfo?.deliveryAddress || draft.deliveryAddress || "",
          deliveryPinCode: draft.poInfo?.deliveryPinCode || draft.deliveryPinCode || "",
          billTo: draft.poInfo?.billTo || draft.billingAddress || "",
          billingPinCode: draft.poInfo?.billingPinCode || draft.billingPinCode || "",
          billingAddress: draft.poInfo?.billingAddress || draft.billingAddress || "",
          gstRegNo: draft.poInfo?.gstRegNo || "",
          cin: draft.poInfo?.cin || "",
          testCertificate: draft.poInfo?.testCertificate || "Yes",
          transportCost: draft.poInfo?.transportCost || "Paid by Customer",
          paymentTerm: draft.paymentTerm || "Select term...",
        });
        if (draft.specs) {
          // Remap old specs to new specs if needed
          const remappedSpecs = draft.specs.map((s: any) => ({
            id: s.id || Math.random().toString(),
            itemDescription: s.itemDescription || s.sku || "",
            size: s.size || "",
            quantity: s.quantity || 0,
            unitPrice: s.unitPrice || 0,
            pattern: s.pattern || s.design || "",
            photoName: s.photoName || null,
          }));
          setSpecs(remappedSpecs.length > 0 ? remappedSpecs : specs);
        }
        if (draft.poAmount) setPoAmount(draft.poAmount);
        if (draft.advanceAmount) setAdvanceAmount(draft.advanceAmount);
        localStorage.removeItem('orderInitiationDraft');
      } catch (e) {}
    }
  }, []);
`;
content = content.replace(/const \[specs, setSpecs\] = useState<GarmentSpec\[\]>\(\[/, stateInjection + '\n  const [specs, setSpecs] = useState<GarmentSpec[]>([\n');

// 3. Update GarmentSpec interface
content = content.replace(/sku: string;/g, 'itemDescription: string;');
content = content.replace(/design: string;/g, 'pattern: string;');
content = content.replace(/stockAvailable: number;/g, 'unitPrice: number;');
content = content.replace(/useExistingStock: number;/g, 'photoName: string | null;');
// We also need to fix the default state initialization
content = content.replace(/sku: "",/g, 'itemDescription: "",');
content = content.replace(/design: "",/g, 'pattern: "",');
content = content.replace(/stockAvailable: 0,/g, 'unitPrice: 0,');
content = content.replace(/useExistingStock: 0,/g, 'photoName: null,');

// 4. Update the Table Headers and rows
content = content.replace(/<th className="px-4 py-3 text-left">SKU<\/th>/, '<th className="px-4 py-3 text-left">Item Description</th>');
content = content.replace(/<th className="px-4 py-3 text-left">Design<\/th>/, '<th className="px-4 py-3 text-left">Pattern</th>');
content = content.replace(/<th className="px-4 py-3 text-left">Stock<\/th>/, '<th className="px-4 py-3 text-left">Unit Price</th>');
content = content.replace(/<th className="px-4 py-3 text-left">Use Stock<\/th>/, '<th className="px-4 py-3 text-left">Upload Photo</th>');
content = content.replace(/<th className="px-4 py-3 text-left">Production<\/th>/, '');

// Update row bindings for the table
// sku -> itemDescription
content = content.replace(/value=\{spec\.sku\}/g, 'value={spec.itemDescription}');
content = content.replace(/"sku"/g, '"itemDescription"');
// design -> pattern
content = content.replace(/value=\{spec\.design\}/g, 'value={spec.pattern}');
content = content.replace(/"design"/g, '"pattern"');
// stockAvailable -> unitPrice
content = content.replace(/value=\{spec\.stockAvailable\}/g, 'value={spec.unitPrice}');
content = content.replace(/"stockAvailable"/g, '"unitPrice"');
// useExistingStock -> photo upload button
content = content.replace(
  /<input\s+type="number"\s+value=\{spec\.useExistingStock\}.*?\/>/gs,
  `<label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition whitespace-nowrap">
      <Upload className="h-4 w-4 mr-2" />
      <span className="truncate max-w-[100px]">{spec.photoName || "Select Photo"}</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) =>
          updateRow(spec.id, "photoName", e.target.files?.[0]?.name || "")
        }
      />
    </label>`
);
// Remove the production column
content = content.replace(/<td className="px-4 py-3 font-semibold text-neutral-900">\s*\{spec\.quantity - spec\.useExistingStock\}\s*<\/td>/gs, '');

// 5. Connect inputs to formData state
content = content.replace(
  /<input\s+type="text"\s+placeholder="e\.g\. PO-2026-001"/s,
  `<input type="text" name="poNumber" value={formData.poNumber} onChange={handleChange} placeholder="e.g. PO-2026-001"`
);
content = content.replace(
  /<input\s+type="date"\s+style=\{\{ color: "#111827" \}\}\s+className=\{`\$\{inputStyle\} h-\[48px\]`\}/,
  `<input type="date" name="poDate" value={formData.poDate} onChange={handleChange} style={{ color: "#111827" }} className={\`\${inputStyle} h-[48px]\`}`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="Customer Name"/s,
  `<input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Customer Name"`
);
// The second type="date" is deliveryDate
content = content.replace(
  /<input\s+type="date"\s+style=\{\{ color: "#111827" \}\}\s+className=\{`\$\{inputStyle\} h-\[48px\]`\}/,
  `<input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} style={{ color: "#111827" }} className={\`\${inputStyle} h-[48px]\`}`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="Name"/s,
  `<input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Name"`
);
content = content.replace(
  /<input\s+type="tel"\s+placeholder="\+91"/s,
  `<input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+91"`
);
content = content.replace(
  /<input\s+type="email"\s+placeholder="email@example\.com"/s,
  `<input type="email" name="emailId" value={formData.emailId} onChange={handleChange} placeholder="email@example.com"`
);
content = content.replace(
  /<textarea\s+placeholder="Enter complete delivery address"/s,
  `<textarea name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="Enter complete delivery address"`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="e\.g\. 422001"\s+style=\{\{ color: "#111827" \}\}\s+className=\{`\$\{inputStyle\} h-\[48px\]`\}/,
  `<input type="text" name="deliveryPinCode" value={formData.deliveryPinCode} onChange={handleChange} placeholder="e.g. 422001" style={{ color: "#111827" }} className={\`\${inputStyle} h-[48px]\`}`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="Company Name"/s,
  `<input type="text" name="billTo" value={formData.billTo} onChange={handleChange} placeholder="Company Name"`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="PIN Code"/s,
  `<input type="text" name="billingPinCode" value={formData.billingPinCode} onChange={handleChange} placeholder="PIN Code"`
);
content = content.replace(
  /<textarea\s+placeholder="Billing address"/s,
  `<textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} placeholder="Billing address"`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="GST Number"/s,
  `<input type="text" name="gstRegNo" value={formData.gstRegNo} onChange={handleChange} placeholder="GST Number"`
);
content = content.replace(
  /<input\s+type="text"\s+placeholder="CIN Number"/s,
  `<input type="text" name="cin" value={formData.cin} onChange={handleChange} placeholder="CIN Number"`
);
content = content.replace(
  /<select style=\{\{ color: "#111827" \}\} className=\{inputStyle\}>/,
  `<select name="testCertificate" value={formData.testCertificate} onChange={handleChange} style={{ color: "#111827" }} className={inputStyle}>`
);
content = content.replace(
  /<select style=\{\{ color: "#111827" \}\} className=\{inputStyle\}>/,
  `<select name="transportCost" value={formData.transportCost} onChange={handleChange} style={{ color: "#111827" }} className={inputStyle}>`
);
content = content.replace(
  /<select style=\{\{ color: "#111827" \}\} className=\{inputStyle\}>/,
  `<select name="paymentTerm" value={formData.paymentTerm} onChange={handleChange} style={{ color: "#111827" }} className={inputStyle}>`
);

// 6. Fix handleSaveDraft and handleSubmitOrder logic
const saveLogic = `
  const handleSaveDraft = () => {
    if (!formData.poNumber) {
      alert("Please enter a PO Number to save as draft");
      return;
    }
    const draft = {
      id: Math.random().toString(),
      poNumber: formData.poNumber,
      customerName: formData.customerName,
      poDate: formData.poDate,
      deliveryDate: formData.deliveryDate,
      poAmount: poAmount,
      advanceAmount: advanceAmount,
      totalAmount: totalAmount,
      paymentTerm: formData.paymentTerm,
      poInfo: formData,
      specs: specs,
      date: new Date().toISOString().split("T")[0],
    };
    const existing = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    localStorage.setItem('draftOrders', JSON.stringify([...existing, draft]));
    alert("Draft Saved Successfully");
  };

  const handleSubmitOrder = () => {
    if (!formData.poNumber || !formData.customerName) {
      alert("PO Number and Customer Name are required to submit order");
      return;
    }
    const order = {
      id: Math.random().toString(),
      poNumber: formData.poNumber,
      customerName: formData.customerName,
      poDate: formData.poDate,
      deliveryDate: formData.deliveryDate,
      poAmount: poAmount,
      totalAmount: totalAmount,
      specs: specs,
      status: 'pending',
      date: new Date().toISOString().split("T")[0],
    };
    const existing = JSON.parse(localStorage.getItem('savedOrders') || '[]');
    localStorage.setItem('savedOrders', JSON.stringify([...existing, order]));
    alert("Order Submitted Successfully");
    router.push('/stock-calculation');
  };
`;

content = content.replace(/const handleSaveDraft = \(\) => \{\s*alert\("Draft Saved Successfully"\);\s*\};/, saveLogic);
content = content.replace(/onClick=\{handleSaveDraft\}/, 'onClick={handleSaveDraft}');
content = content.replace(/onClick=\{\(\) => alert\("Order Submitted Successfully"\)\}/, 'onClick={handleSubmitOrder}');

fs.writeFileSync(file, content);
console.log('Script completed');
