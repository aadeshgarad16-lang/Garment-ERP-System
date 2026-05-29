const fs = require('fs');
const path = 'c:/Users/USER/Downloads/Sason_Project/garment-erp-system/src/locales/';

const newTranslations = {
  header: {
    title: "Order Initiation",
    description: "Create and manage purchase orders"
  },
  purchaseOrderInfo: {
    title: "Purchase Order Information",
    poNumber: "PO Number",
    customerName: "Customer Name",
    poDate: "PO Date",
    deliveryDate: "Delivery Date",
    contactPerson: "Contact Person Name",
    phoneNumber: "Phone Number",
    emailId: "Email ID",
    deliveryAddress: "Delivery Address",
    deliveryAddressPin: "Delivery Address (PIN)",
    billTo: "Bill / Invoice To",
    billingAddressPin: "Billing Address (PIN)",
    billingAddress: "Billing Address",
    gstRegNo: "GST Reg No",
    cin: "CIN",
    testCertificate: "Test Certificate Required",
    transportCost: "Transport Cost",
    poFile: "PO File",
    uploadPoFile: "Upload PO File",
    uploadConstraints: "PDF, DOCX, XLS, PNG, JPG up to 10MB"
  },
  paymentDetails: {
    title: "Payment Details",
    paymentTerm: "Payment Term",
    selectTerm: "Select term...",
    poAmount: "PO Amount",
    advanceAmount: "Advance Amount",
    subtotal: "Subtotal",
    tax: "Tax (0%)",
    totalAmount: "Total Amount"
  },
  garmentSpecifications: {
    title: "Garment Specifications",
    addRow: "Add Row",
    table: {
      itemDescription: "Item Description",
      size: "Size",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      pattern: "Pattern",
      uploadPhoto: "Upload Photo",
      action: "Action"
    }
  },
  footer: {
    saveDraft: "Save as Draft",
    viewDrafts: "View Drafts",
    submitOrder: "Submit Order",
    goToStockCalculation: "Go to Stock Calculation →"
  }
};

const hiTranslations = {
  header: {
    title: "ऑर्डर आरंभ",
    description: "खरीद ऑर्डर बनाएं और प्रबंधित करें"
  },
  purchaseOrderInfo: {
    title: "खरीद ऑर्डर की जानकारी",
    poNumber: "पीओ नंबर",
    customerName: "ग्राहक का नाम",
    poDate: "पीओ तिथि",
    deliveryDate: "वितरण तिथि",
    contactPerson: "संपर्क व्यक्ति का नाम",
    phoneNumber: "फ़ोन नंबर",
    emailId: "ईमेल आईडी",
    deliveryAddress: "वितरण का पता",
    deliveryAddressPin: "वितरण का पता (पिन)",
    billTo: "बिल / चालान",
    billingAddressPin: "बिलिंग पता (पिन)",
    billingAddress: "बिलिंग पता",
    gstRegNo: "जीएसटी पंजीकरण संख्या",
    cin: "सीआईएन",
    testCertificate: "परीक्षण प्रमाणपत्र आवश्यक",
    transportCost: "परिवहन लागत",
    poFile: "पीओ फ़ाइल",
    uploadPoFile: "पीओ फ़ाइल अपलोड करें",
    uploadConstraints: "PDF, DOCX, XLS, PNG, JPG 10MB तक"
  },
  paymentDetails: {
    title: "भुगतान विवरण",
    paymentTerm: "भुगतान अवधि",
    selectTerm: "अवधि चुनें...",
    poAmount: "पीओ राशि",
    advanceAmount: "अग्रिम राशि",
    subtotal: "उप-योग",
    tax: "कर (0%)",
    totalAmount: "कुल राशि"
  },
  garmentSpecifications: {
    title: "परिधान विनिर्देश",
    addRow: "पंक्ति जोड़ें",
    table: {
      itemDescription: "वस्तु का विवरण",
      size: "आकार",
      quantity: "मात्रा",
      unitPrice: "इकाई मूल्य",
      pattern: "पैटर्न",
      uploadPhoto: "फोटो अपलोड करें",
      action: "कार्रवाई"
    }
  },
  footer: {
    saveDraft: "ड्राफ्ट के रूप में सहेजें",
    viewDrafts: "ड्राफ्ट देखें",
    submitOrder: "ऑर्डर सबमिट करें",
    goToStockCalculation: "स्टॉक गणना पर जाएं →"
  }
};

const mrTranslations = {
  header: {
    title: "ऑर्डर सुरूवात",
    description: "खरेदी ऑर्डर तयार आणि व्यवस्थापित करा"
  },
  purchaseOrderInfo: {
    title: "खरेदी ऑर्डर माहिती",
    poNumber: "पीओ क्रमांक",
    customerName: "ग्राहकाचे नाव",
    poDate: "पीओ तारीख",
    deliveryDate: "वितरण तारीख",
    contactPerson: "संपर्क व्यक्तीचे नाव",
    phoneNumber: "फोन नंबर",
    emailId: "ईमेल आयडी",
    deliveryAddress: "वितरण पत्ता",
    deliveryAddressPin: "वितरण पत्ता (पिन)",
    billTo: "बिल / चलन",
    billingAddressPin: "बिलिंग पत्ता (पिन)",
    billingAddress: "बिलिंग पत्ता",
    gstRegNo: "जीएसटी नोंदणी क्रमांक",
    cin: "सीआयएन",
    testCertificate: "चाचणी प्रमाणपत्र आवश्यक",
    transportCost: "वाहतूक खर्च",
    poFile: "पीओ फाइल",
    uploadPoFile: "पीओ फाइल अपलोड करा",
    uploadConstraints: "PDF, DOCX, XLS, PNG, JPG 10MB पर्यंत"
  },
  paymentDetails: {
    title: "पेमेंट तपशील",
    paymentTerm: "पेमेंट मुदत",
    selectTerm: "मुदत निवडा...",
    poAmount: "पीओ रक्कम",
    advanceAmount: "आगाऊ रक्कम",
    subtotal: "उप-एकूण",
    tax: "कर (0%)",
    totalAmount: "एकूण रक्कम"
  },
  garmentSpecifications: {
    title: "गारमेंट तपशील",
    addRow: "ओळ जोडा",
    table: {
      itemDescription: "वस्तूचे वर्णन",
      size: "आकार",
      quantity: "प्रमाण",
      unitPrice: "एकक किंमत",
      pattern: "पॅटर्न",
      uploadPhoto: "फोटो अपलोड करा",
      action: "कृती"
    }
  },
  footer: {
    saveDraft: "ड्राफ्ट म्हणून सेव्ह करा",
    viewDrafts: "ड्राफ्ट्स पहा",
    submitOrder: "ऑर्डर सबमिट करा",
    goToStockCalculation: "स्टॉक गणनेवर जा →"
  }
};

['en', 'hi', 'mr'].forEach(lang => {
  const file = path + lang + '.json';
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!data.orderInitiation) {
    data.orderInitiation = {};
  }
  
  const translations = lang === 'en' ? newTranslations : (lang === 'hi' ? hiTranslations : mrTranslations);
  
  Object.keys(translations).forEach(key => {
    if (key !== 'tracker') {
      data.orderInitiation[key] = translations[key];
    }
  });

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
});
console.log('Translations injected');
