import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fallback for currency format in PDF to avoid unicode issues with default fonts
export const formatCurrencyPDF = (amount: number) => {
  return `INR ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const generateGRNPDF = (order: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Set default colors
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Outer Border
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - 2 * margin;
  doc.rect(margin, margin, contentWidth, contentHeight);

  // 1. Header & Company Branding
  // Pill background for "GOODS RECEIVED NOTE"
  const headerText = "GOODS RECEIVED NOTE";
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const textWidth = doc.getTextWidth(headerText);
  const pillWidth = textWidth + 10;
  const pillHeight = 6;
  const pillX = (pageWidth - pillWidth) / 2;
  const pillY = margin + 2;
  
  doc.setFillColor(200, 200, 200); // Light gray fill for pill
  doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 3, 3, 'FD');
  doc.text(headerText, pillX + 5, pillY + 4.5);

  // Logo Placeholder (Left)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('S', margin + 15, margin + 15); // Logo graphic sim
  doc.setFontSize(9);
  doc.text('SASONS', margin + 5, margin + 20);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('WORKS WEAR', margin + 7, margin + 23);
  doc.text('A Sumeet Group Enterprise', margin + 3, margin + 26);

  // Company Details (Center)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SASONS WORKS WEAR PRIVATE LIMITED', pageWidth / 2, margin + 14, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('AN ISO 9001 : 2015 Certified Co.', pageWidth / 2, margin + 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Mfg. : Industrial Garments', pageWidth / 2, margin + 26, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Factory : 1st Floor, Nana Chamber, Above Bank of Maharashtra, Kasarwadi, Pune - 34.', pageWidth / 2, margin + 31, { align: 'center' });
  doc.text('E-mail : sasons@sumeetdelta.com', pageWidth / 2, margin + 35, { align: 'center' });

  // Draw line below header
  const headerBottomY = margin + 38;
  doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);

  // 2. Primary Details Grid (Top Meta Box)
  // Row 1: Challan, Invoice, Date
  const metaRow1Y = headerBottomY + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Challan No.:', margin + 2, metaRow1Y);
  doc.text('Invoice No.:', margin + 60, metaRow1Y);
  doc.text('Date :', pageWidth - margin - 50, metaRow1Y);
  doc.setFont('helvetica', 'normal');
  const grnDate = order.receivingDates && order.receivingDates.length > 0 ? order.receivingDates[order.receivingDates.length - 1] : new Date().toLocaleDateString();
  doc.text(grnDate, pageWidth - margin - 35, metaRow1Y);

  // Draw line below Row 1
  const metaRow2StartY = metaRow1Y + 3;
  doc.line(margin, metaRow2StartY, pageWidth - margin, metaRow2StartY);

  // Row 2: Split View (Supplier Details / PO Details)
  // Draw vertical split line
  const splitX = margin + (contentWidth * 0.65);
  const metaRow2Height = 25;
  doc.line(splitX, metaRow2StartY, splitX, metaRow2StartY + metaRow2Height);

  // Left Block: Supplier Name & Address
  doc.setFont('helvetica', 'bold');
  doc.text("Supplier's Name & Address :", margin + 2, metaRow2StartY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(order.supplier || 'Vendor Name', margin + 2, metaRow2StartY + 11);
  // Address lines (dummy)
  doc.line(margin + 2, metaRow2StartY + 14, splitX - 2, metaRow2StartY + 14);
  doc.line(margin + 2, metaRow2StartY + 19, splitX - 2, metaRow2StartY + 19);
  doc.line(margin + 2, metaRow2StartY + 24, splitX - 2, metaRow2StartY + 24);

  // Right Block: P.O. Details
  doc.setFont('helvetica', 'bold');
  // Sub-header box for P.O. DETAILS
  doc.line(splitX, metaRow2StartY + 7, pageWidth - margin, metaRow2StartY + 7);
  doc.text("P. O. DETAILS", splitX + ((pageWidth - margin - splitX) / 2), metaRow2StartY + 5, { align: 'center' });
  
  doc.text("P. O. No.:", splitX + 2, metaRow2StartY + 14);
  doc.setFontSize(14);
  doc.text((order.id || '').replace('PO-', ''), splitX + 25, metaRow2StartY + 14);
  
  doc.setFontSize(9);
  doc.text("Date :", splitX + 2, metaRow2StartY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(order.date || '', splitX + 15, metaRow2StartY + 22);

  // Draw line below Meta Details
  const tableStartY = metaRow2StartY + metaRow2Height;
  doc.line(margin, tableStartY, pageWidth - margin, tableStartY);

  // 3. Main Inspection Grid / Table Layout using jspdf-autotable
  const receivedQty = order.receivedQty || order.items;
  
  // Create 15 empty rows to fill the page, padding with actual data first
  const tableData = [];
  const actualItemsCount = 1; // Assuming 1 line item for now
  
  for (let i = 0; i < 15; i++) {
    if (i < actualItemsCount) {
      tableData.push([
        (i + 1).toString(), // Sr. No.
        'Items Ordered (General)', // Description
        'Pcs', // Unit
        order.items.toString(), // As per Bill
        receivedQty.toString(), // Actual Received
        receivedQty.toString(), // Accepted
        '0' // Rejected
      ]);
    } else {
      tableData.push(['', '', '', '', '', '', '']); // Empty rows
    }
  }

  autoTable(doc, {
    startY: tableStartY,
    theme: 'grid',
    head: [
      [
        { content: 'Goods Received Inspection Note', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Q. C. DETAILS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }
      ],
      [
        { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Description', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Unit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'QUANTITY', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Accepted', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Rejected', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        { content: 'As per Bill /\nChallan', styles: { halign: 'center' } },
        { content: 'Actual\nReceived', styles: { halign: 'center' } }
      ]
    ],
    body: tableData,
    styles: {
      fontSize: 9,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
      cellPadding: 2,
      minCellHeight: 8
    },
    headStyles: {
      fillColor: [255, 255, 255], // White background
      textColor: [0, 0, 0],       // Black text
      lineWidth: 0.3,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, // Sr No
      1: { cellWidth: 'auto' }, // Description
      2: { cellWidth: 15, halign: 'center' }, // Unit
      3: { cellWidth: 22, halign: 'center' }, // As per bill
      4: { cellWidth: 22, halign: 'center' }, // Actual
      5: { cellWidth: 20, halign: 'center' }, // Accepted
      6: { cellWidth: 20, halign: 'center' }  // Rejected
    },
    margin: { left: margin, right: margin }
  });

  // 4. Document Footer (Signatures)
  // Determine where the table ended
  const finalY = (doc as any).lastAutoTable.finalY;
  
  // Footer text
  const footerY = pageHeight - margin - 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Purchase Manager Signature', margin + 5, footerY);
  doc.text('GRN Prepared By', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Q. C. Inspected By', pageWidth - margin - 5, footerY, { align: 'right' });

  // Get GRN Number
  const grnNumber = order.grnNumbers && order.grnNumbers.length > 0 
    ? order.grnNumbers[order.grnNumbers.length - 1] 
    : `GRN-${order.id}`;
    
  // Save the PDF
  doc.save(`${grnNumber || 'Document'}.pdf`);
};

export const generateProcurementPDF = (po: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PROCUREMENT COMPLETION REPORT', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 32);

  // Document Details Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 40, pageWidth - 30, 35, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Purchase Order Summary:', 20, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`PO Number: ${po.id}`, 20, 58);
  doc.text(`Order Date: ${po.date}`, 20, 66);
  doc.text(`Status: ${po.status}`, 20, 74);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier Details:', pageWidth / 2, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${po.supplier}`, pageWidth / 2, 58);
  doc.text(`Items Ordered: ${po.items}`, pageWidth / 2, 66);
  doc.text(`Delivered On: ${po.deliveredOn || 'N/A'}`, pageWidth / 2, 74);

  // Fulfillment History (GRNs)
  doc.setFont('helvetica', 'bold');
  doc.text('Fulfillment History (GRN Records)', 15, 90);
  
  const grnData: string[][] = [];
  if (po.grnNumbers && po.grnNumbers.length > 0) {
    po.grnNumbers.forEach((grn: string, idx: number) => {
      grnData.push([
        grn,
        po.receivingDates ? po.receivingDates[idx] : po.deliveredOn,
        'Main Store',
        'Verified'
      ]);
    });
  } else {
    grnData.push(['N/A', po.deliveredOn || po.date, 'Main Store', 'Verified']);
  }

  autoTable(doc, {
    startY: 95,
    head: [['GRN Number', 'Receiving Date', 'Location', 'QC Status']],
    body: grnData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: 255 }, // Slate-700
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] }
  });

  // Final Financial Summary Table
  const finalY1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Final Invoice Summary', 15, finalY1);

  const financialData = [
    [
      'Articles Purchased',
      po.items.toString(),
      formatCurrencyPDF((po.total || 0) / (po.items || 1)),
      formatCurrencyPDF(po.total || 0)
    ]
  ];

  autoTable(doc, {
    startY: finalY1 + 5,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: financialData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Totals Breakdown
  const finalY2 = (doc as any).lastAutoTable.finalY + 10;
  const totalAmount = po.total || 0;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Base Amount:', pageWidth - 80, finalY2);
  doc.text(formatCurrencyPDF(totalAmount * 0.82), pageWidth - 15, finalY2, { align: 'right' });
  
  doc.text('Taxes & Duties:', pageWidth - 80, finalY2 + 8);
  doc.text(formatCurrencyPDF(totalAmount * 0.18), pageWidth - 15, finalY2 + 8, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Invoice Value:', pageWidth - 80, finalY2 + 18);
  doc.text(formatCurrencyPDF(totalAmount), pageWidth - 15, finalY2 + 18, { align: 'right' });
  
  doc.line(pageWidth - 80, finalY2 + 12, pageWidth - 15, finalY2 + 12);
  doc.line(pageWidth - 80, finalY2 + 22, pageWidth - 15, finalY2 + 22);
  
  // Footer with Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`Procurement-PO-${po.id}.pdf`);
};

export const generateOfficialPurchaseOrderPDF = (poData: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1); // Standard thin lines (0.5pt)


  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', pageWidth / 2, margin + 4, { align: 'center' });

  // Outer Box (Starts below title)
  const boxStartY = margin + 10;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - margin - boxStartY;
  doc.rect(margin, boxStartY, contentWidth, contentHeight);

  // Grid coordinates
  const leftColW = contentWidth * 0.45;
  const rightColW = contentWidth - leftColW;
  const splitX = margin + leftColW;
  
  const leftColInnerW = splitX - margin - 4;

  let invoiceText = poData.invoiceTo || '';
  let consigneeText = poData.consignee || '';

  const invoiceRaw = doc.splitTextToSize(invoiceText, leftColInnerW);
  const consigneeRaw = doc.splitTextToSize(consigneeText, leftColInnerW);
  const supplierString = poData.supplierAddress ? `${poData.supplier || 'N/A'}\n${poData.supplierAddress}` : poData.supplier || 'N/A';
  const supplierRaw = doc.splitTextToSize(supplierString, leftColInnerW);
  
  // Dynamic Box Offsets (Using explicit currentY approach)
  const lineHeight = 3.2;
  const padding = 12;
  
  const invoiceH = Math.max(30, invoiceRaw.length * lineHeight + padding);
  const consigneeH = Math.max(30, consigneeRaw.length * lineHeight + padding);
  const supplierH = Math.max(25, supplierRaw.length * lineHeight + padding);

  const gridH = invoiceH + consigneeH + supplierH;

  // Draw vertical split line for metadata grid
  doc.line(splitX, boxStartY, splitX, boxStartY + gridH);

  // Grid horizontal lines
  const rowH = 10;
  const hBox2 = rowH * 2;
  const hBox3 = rowH * 3;
  const hBox4 = rowH * 4;
  
  // Right side grid lines
  const gridStartY = boxStartY;
  doc.line(splitX, gridStartY + rowH, pageWidth - margin, gridStartY + rowH);
  doc.line(splitX, gridStartY + hBox2, pageWidth - margin, gridStartY + hBox2);
  doc.line(splitX, gridStartY + hBox3, pageWidth - margin, gridStartY + hBox3);
  doc.line(splitX, gridStartY + hBox4, pageWidth - margin, gridStartY + hBox4);
  
  // Vertical split in right col for first 4 rows
  doc.line(splitX + rightColW / 2, gridStartY, splitX + rightColW / 2, gridStartY + hBox4);

  // Bottom of the header grid
  const gridBottomY = boxStartY + gridH;
  doc.line(margin, gridBottomY, pageWidth - margin, gridBottomY);

  const renderAddressBox = (
    title: string,
    companyName: string,
    addressText: string,
    x: number,
    startY: number,
    boxWidth: number,
    boxHeight: number
  ) => {
    // A. Draw Outer Border Box (or use existing grid lines, but rect is safer)
    doc.rect(x, startY, boxWidth, boxHeight);
    let currentY = startY + 4; // Padding top

    // B. Render Box Title (e.g., "Invoice To") -> Bold 8.5pt
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, x + 2, currentY);
    currentY += 4.5;

    // C. Render Company Name -> Bold 8pt
    if (companyName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const compLines = doc.splitTextToSize(companyName, boxWidth - 4);
      doc.text(compLines, x + 2, currentY);
      currentY += compLines.length * 3.5;
    }

    // D. Render Remaining Address Details -> Normal 7.5pt (Clamped to Box)
    if (addressText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      
      const rawLines = doc.splitTextToSize(addressText, boxWidth - 4);
      
      // Calculate maximum safe lines that fit in remaining box height
      const remainingHeight = (startY + boxHeight - 1) - currentY;
      const maxAllowedLines = Math.max(1, Math.floor(remainingHeight / 3.2));
      
      // Slice array so text NEVER crosses the box bottom border
      const safeLines = rawLines.slice(0, maxAllowedLines);

      doc.text(safeLines, x + 2, currentY, { lineHeightFactor: 1.15 });
    }
  };

  const splitAddress = (text: string) => {
    if (!text) return { comp: '', addr: '' };
    const lines = text.split('\n');
    return { comp: lines[0] || '', addr: lines.slice(1).join('\n') };
  };

  const inv = splitAddress(invoiceText);
  const con = splitAddress(consigneeText);
  const sup = splitAddress(supplierString);

  // Render left column boxes dynamically pushing down
  let currentY = gridStartY;
  
  renderAddressBox('Invoice To', inv.comp, inv.addr, margin, currentY, leftColW, invoiceH);
  currentY += invoiceH;
  
  renderAddressBox('Consignee (Ship to)', con.comp, con.addr, margin, currentY, leftColW, consigneeH);
  currentY += consigneeH;
  
  renderAddressBox('Supplier (Bill from)', sup.comp, sup.addr, margin, currentY, leftColW, supplierH);

  // Right column labels
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Voucher No.', splitX + 2, gridStartY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(poData.poNumber || '', splitX + 2, gridStartY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Dated', splitX + rightColW / 2 + 2, gridStartY + 4);
  doc.setFont('helvetica', 'normal');
  const formattedDated = poData.poDate 
    ? new Date(poData.poDate).toLocaleDateString('en-US') 
    : new Date().toLocaleDateString('en-US');
  doc.text(formattedDated, splitX + rightColW / 2 + 2, gridStartY + 9);

  // Row 2
  // Left box is empty in template
  doc.setFont('helvetica', 'bold');
  doc.text('Mode/Terms of Payment', splitX + rightColW / 2 + 2, gridStartY + rowH + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(poData.paymentTerms || 'Within 30 Days', splitX + rightColW / 2 + 2, gridStartY + rowH + 9);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Reference No. & Date.', splitX + 2, gridStartY + rowH * 2 + 4);
  doc.text('Other References', splitX + rightColW / 2 + 2, gridStartY + rowH * 2 + 4);

  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatched through', splitX + 2, gridStartY + rowH * 3 + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(poData.transportMode || '', splitX + 2, gridStartY + rowH * 3 + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Destination', splitX + rightColW / 2 + 2, gridStartY + rowH * 3 + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(poData.branch || '', splitX + rightColW / 2 + 2, gridStartY + rowH * 3 + 9);

  // Row 5 (Terms of Delivery)
  doc.setFont('helvetica', 'bold');
  doc.text('Terms of Delivery', splitX + 2, gridStartY + rowH * 4 + 4);


  // Table (AutoTable)
  const tableData = (poData.materials || []).map((m: any, i: number) => [
    i + 1,
    m.name,
    poData.deliveryDate || '', 
    m.supplierQty || m.qty || 0,
    m.unitCost ? m.unitCost.toFixed(2) : '0.00',
    m.unit || 'Pieces',
    '0%',
    m.unitCost && (m.supplierQty || m.qty) ? ((m.supplierQty || m.qty) * m.unitCost).toFixed(2) : '0.00'
  ]);
  
  // Add Total row
  tableData.push([
    '', 'Total', '', '', '', '', '', poData.subtotal ? poData.subtotal.toFixed(2) : '0.00'
  ]);

  autoTable(doc, {
    startY: gridBottomY,
    head: [['Sl\nNo.', 'Description of Goods', 'Due on', 'Quantity', 'Rate', 'per', 'Disc. %', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0],    
      fontStyle: 'bold',
      lineColor: [0, 0, 0], 
      lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0], 
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 }, 
      textColor: [0, 0, 0]     
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, 
      1: { halign: 'left' },                 
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 18 }, 
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 25 }, 
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY || (gridBottomY + 20);

  // Footer block
  const footerY = pageHeight - margin - 35; // Moved up slightly to ensure nothing cuts off
  
  // Total Row Line
  doc.line(margin, finalY - 8, pageWidth - margin, finalY - 8); 
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Draw continuous vertical lines down to footerY
  const colWidths = [10, 77, 15, 18, 18, 12, 15, 25];
  let currentX = margin;
  for (let i = 0; i < colWidths.length - 1; i++) {
    currentX += colWidths[i];
    doc.line(currentX, gridBottomY, currentX, footerY);
  }
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bolditalic');
  doc.text('E. & O.E', pageWidth - margin, footerY + 4, { align: 'right' });
  
  // Calculate Taxes and Totals
  const subtotal = poData.subtotal || 0;
  const gstRate = 9; // 9% CGST + 9% SGST = 18% total
  const cgstAmount = (subtotal * gstRate) / 100;
  const sgstAmount = (subtotal * gstRate) / 100;
  
  const rawTotal = subtotal + cgstAmount + sgstAmount;
  const roundedTotal = Math.round(rawTotal);
  const roundOff = roundedTotal - rawTotal;

  // Render Tax Block
  doc.setFont('helvetica', 'normal');
  let taxY = footerY + 10;
  const amountsX = pageWidth - margin - 2;
  const labelsX = amountsX - 35;
  
  doc.text(`Add : CGST (${gstRate}%)`, labelsX, taxY, { align: 'right' });
  doc.text(cgstAmount.toFixed(2), amountsX, taxY, { align: 'right' });
  taxY += 5;
  
  doc.text(`Add : SGST (${gstRate}%)`, labelsX, taxY, { align: 'right' });
  doc.text(sgstAmount.toFixed(2), amountsX, taxY, { align: 'right' });
  taxY += 5;
  
  doc.text('Round Off', labelsX, taxY, { align: 'right' });
  doc.text(roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2), amountsX, taxY, { align: 'right' });
  taxY += 6;
  
  // Grand Total Line
  doc.line(labelsX - 25, taxY - 4, amountsX + 2, taxY - 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total (Rs.)', labelsX, taxY, { align: 'right' });
  doc.text(roundedTotal.toFixed(2), amountsX, taxY, { align: 'right' });
  doc.line(labelsX - 25, taxY + 2, amountsX + 2, taxY + 2);
  
  // Signatory Block Box
  const sigW = 70;
  const sigH = 20;
  const sigX = pageWidth - margin - sigW;
  const sigY = pageHeight - margin - sigH - 6;
  doc.rect(sigX, sigY, sigW, sigH);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('for SASONS WORKS WEAR PRIVATE LIMITED', sigX + 2, sigY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', sigX + sigW - 2, sigY + sigH - 2, { align: 'right' });
  
  // Bottom-most tag
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a Computer Generated Document', pageWidth / 2, pageHeight - margin, { align: 'center' });

  return doc;
};
