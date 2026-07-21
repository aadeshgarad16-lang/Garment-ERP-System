import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { format, data, title = 'Article Stock Overview' } = body;

    if (!format || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stock Overview');

      // Define columns based on the first item or a standard set
      const isFinishedGoods = data.length > 0 && 'production' in data[0];

      if (isFinishedGoods) {
        worksheet.columns = [
          { header: 'Sr. No', key: 'srNo', width: 10 },
          { header: 'Type', key: 'type', width: 25 },
          { header: 'Code', key: 'code', width: 15 },
          { header: 'Opening Stock', key: 'openingStock', width: 15 },
          { header: 'Production', key: 'production', width: 15 },
          { header: 'Sale', key: 'sale', width: 15 },
          { header: 'Closing Stock', key: 'closingStock', width: 15 },
          { header: 'Cost', key: 'cost', width: 15 },
          { header: 'Total Amount', key: 'totalAmount', width: 20 },
          { header: 'Unit', key: 'unit', width: 10 },
        ];
      } else {
        worksheet.columns = [
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Code', key: 'code', width: 15 },
          { header: 'Unit', key: 'unit', width: 10 },
          { header: 'Op. Stock', key: 'openingStock', width: 15 },
          { header: 'Purchase', key: 'purchase', width: 15 },
          { header: 'Total', key: 'total', width: 15 },
          { header: 'Issue', key: 'issue', width: 15 },
          { header: 'Closing', key: 'closing', width: 15 },
          { header: 'WIP', key: 'wip', width: 15 },
          { header: 'Net Total', key: 'netTotal', width: 15 },
          { header: 'Rate', key: 'rate', width: 15 },
          { header: 'Total Amount', key: 'totalAmount', width: 20 },
        ];
      }

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add rows
      data.forEach((item, idx) => {
        const rowData = { ...item };
        if (isFinishedGoods) {
          rowData.srNo = item.srNo || idx + 1;
        }
        worksheet.addRow(rowData);
      });

      // Format currency columns
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const rateCol = isFinishedGoods ? 'cost' : 'rate';
          const rateCell = row.getCell(isFinishedGoods ? 8 : 11);
          if (rateCell && typeof rateCell.value === 'number') {
            rateCell.numFmt = '₹#,##0.00';
          }
          const totalCol = isFinishedGoods ? 9 : 12;
          const totalCell = row.getCell(totalCol);
          if (totalCell && typeof totalCell.value === 'number') {
            totalCell.numFmt = '₹#,##0.00';
          }
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="stock_overview.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      const isFinishedGoods = data.length > 0 && 'production' in data[0];

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, layout: 'landscape' });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(
            new NextResponse(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="stock_overview.pdf"`,
              },
            })
          );
        });

        // Add Title
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();

        // Very basic table layout using text positions for demo
        const tableTop = 100;
        let yPosition = tableTop;

        doc.fontSize(10);
        doc.font('Helvetica-Bold');

        if (isFinishedGoods) {
           doc.text('Sr No', 30, yPosition);
           doc.text('Type', 80, yPosition);
           doc.text('Opening', 250, yPosition);
           doc.text('Prod.', 320, yPosition);
           doc.text('Sale', 370, yPosition);
           doc.text('Closing', 420, yPosition);
           doc.text('Cost', 490, yPosition);
           doc.text('Total', 560, yPosition);
           doc.text('Unit', 640, yPosition);
        } else {
           doc.text('Description', 30, yPosition);
           doc.text('Op. Stock', 250, yPosition);
           doc.text('Purch.', 310, yPosition);
           doc.text('Total', 360, yPosition);
           doc.text('Issue', 410, yPosition);
           doc.text('Closing', 460, yPosition);
           doc.text('WIP', 510, yPosition);
           doc.text('Net', 560, yPosition);
           doc.text('Rate', 610, yPosition);
           doc.text('Amount', 670, yPosition);
        }
        
        yPosition += 20;
        doc.font('Helvetica');

        // Draw line
        doc.moveTo(30, yPosition - 10).lineTo(750, yPosition - 10).stroke();

        data.forEach((item, idx) => {
          if (yPosition > 500) {
            doc.addPage();
            yPosition = 50;
          }

          if (isFinishedGoods) {
            doc.text((item.srNo || idx + 1).toString(), 30, yPosition);
            doc.text(String(item.type || '').substring(0, 30), 80, yPosition);
            doc.text(String(item.openingStock || 0), 250, yPosition);
            doc.text(String(item.production || 0), 320, yPosition);
            doc.text(String(item.sale || 0), 370, yPosition);
            doc.text(String(item.closingStock || 0), 420, yPosition);
            doc.text(String(item.cost || 0), 490, yPosition);
            doc.text(String(item.totalAmount || 0), 560, yPosition);
            doc.text(String(item.unit || ''), 640, yPosition);
          } else {
            doc.text(String(item.description || '').substring(0, 40), 30, yPosition);
            doc.text(String(item.openingStock || 0), 250, yPosition);
            doc.text(String(item.purchase || 0), 310, yPosition);
            doc.text(String(item.total || 0), 360, yPosition);
            doc.text(String(item.issue || 0), 410, yPosition);
            doc.text(String(item.closing || 0), 460, yPosition);
            doc.text(String(item.wip || 0), 510, yPosition);
            doc.text(String(item.netTotal || 0), 560, yPosition);
            doc.text(String(item.rate || 0), 610, yPosition);
            doc.text(String(item.totalAmount || 0), 670, yPosition);
          }

          yPosition += 20;
        });

        doc.end();
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
