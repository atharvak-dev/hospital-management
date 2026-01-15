const puppeteer = require('puppeteer');

/**
 * Generates an invoice PDF and returns it as a base64 string.
 * No files are stored locally - everything is in-memory.
 */
const generateInvoicePDF = async (invoiceData) => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const htmlContent = generateHTML(invoiceData);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF as buffer (no file storage)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
        });

        await browser.close();

        // Convert buffer to base64
        const base64 = pdfBuffer.toString('base64');

        return {
            base64,
            mimeType: 'application/pdf',
            filename: `${invoiceData.invoice_number}.pdf`
        };
    } catch (err) {
        console.error('PDF Generation Error:', err);
        throw err;
    }
};


const generateHTML = (data) => {
    const { invoice_number, invoice_date, patient, doctor, items, subtotal, tax, discount, total_amount, payment_method } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .clinic-info h1 { margin: 0; color: #2563EB; font-size: 24px; }
            .invoice-details { text-align: right; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .box { background: #f9fafb; padding: 15px; border-radius: 8px; width: 45%; }
            .box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { width: 300px; margin-left: auto; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="clinic-info">
                <h1>HealthCare Clinic</h1>
                <p>123 Medical Plaza, Cityville<br>Ph: +91 98765 43210</p>
            </div>
            <div class="invoice-details">
                <h1 style="color: #333;">INVOICE</h1>
                <p>#${invoice_number}<br>${new Date(invoice_date).toLocaleDateString()}</p>
            </div>
        </div>

        <div class="meta">
            <div class="box">
                <h3>Bill To:</h3>
                <p><strong>${patient.first_name} ${patient.last_name}</strong><br>
                ID: ${patient.patient_code}<br>
                ${patient.address || ''}<br>
                ${patient.phone}</p>
            </div>
            <div class="box">
                <h3>Doctor:</h3>
                <p><strong>Dr. ${doctor?.full_name || 'Clinic Staff'}</strong><br>
                General Medicine</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: center">Qty</th>
                    <th style="text-align: right">Price</th>
                    <th style="text-align: right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr>
                    <td>
                        <strong>${item.item_type.toUpperCase()}</strong><br>
                        <span style="font-size: 12px; color: #666;">${item.item_description}</span>
                    </td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: right">₹${item.unit_price}</td>
                    <td style="text-align: right">₹${item.total_price}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="row"><span>Subtotal:</span> <span>₹${subtotal}</span></div>
            <div class="row"><span>Tax (0%):</span> <span>₹${tax}</span></div>
            <div class="row"><span>Discount:</span> <span>- ₹${discount}</span></div>
            <div class="row total-row"><span>Total:</span> <span>₹${total_amount}</span></div>
            <br>
            <div class="row"><span>Payment Mode:</span> <span style="text-transform: capitalize">${payment_method || 'Unpaid'}</span></div>
        </div>

        <div class="footer">
            <p>Thank you for your visit. Get well soon!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </body>
    </html>
    `;
};

module.exports = { generateInvoicePDF };
