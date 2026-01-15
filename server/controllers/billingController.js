const { pool } = require('../config/db');
const { generateInvoicePDF } = require('../services/pdfService');

// Create Invoice (Draft)
const createInvoice = async (req, res) => {
    const { patient_id, visit_id, items, discount, tax, payment_method, payment_status } = req.body;
    // items: [{ type, description, quantity, unit_price }]

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Calculate totals
        let subtotal = 0;
        items.forEach(item => {
            const total = item.quantity * item.unit_price;
            item.total_price = total;
            subtotal += total;
        });

        const total_amount = subtotal - (discount || 0) + (tax || 0);

        // Initial insert is DRAFT. No invoice number yet.
        const draftNumber = 'DRAFT-' + Date.now().toString().slice(-6);

        // 1. Create Invoice Header
        const invResult = await client.query(
            `INSERT INTO invoices (
                invoice_number, patient_id, visit_id, invoice_date, subtotal, discount, tax, total_amount, 
                payment_status, payment_method, payment_date, created_by, status
            ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10, 'draft') RETURNING invoice_id, invoice_number`,
            [
                draftNumber, patient_id, visit_id || null, subtotal, discount || 0, tax || 0, total_amount,
                payment_status || 'pending', payment_method, req.user.user_id
            ]
        );
        const invoice_id = invResult.rows[0].invoice_id;

        // 2. Create Items (Bulk Insert for Performance)
        if (items.length > 0) {
            const itemValues = [];
            let placeholderIndex = 1;
            const placeholders = items.map(item => {
                itemValues.push(invoice_id, item.type, item.description, item.quantity, item.unit_price, item.total_price);
                const p = `($${placeholderIndex}, $${placeholderIndex + 1}, $${placeholderIndex + 2}, $${placeholderIndex + 3}, $${placeholderIndex + 4}, $${placeholderIndex + 5})`;
                placeholderIndex += 6;
                return p;
            }).join(', ');

            await client.query(
                `INSERT INTO invoice_items (invoice_id, item_type, item_description, quantity, unit_price, total_price) 
                 VALUES ${placeholders}`,
                itemValues
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Draft Invoice created', invoice_id, invoice_number: draftNumber, total_amount, status: 'draft' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('createInvoice Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// Finalize Invoice
const finalizeInvoice = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check current status
        const checkRes = await client.query('SELECT status, invoice_number FROM invoices WHERE invoice_id = $1', [id]);
        if (checkRes.rows.length === 0) throw new Error('Invoice not found');
        if (checkRes.rows[0].status === 'finalized') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invoice already finalized' });
        }

        // 2. Generate Sequential Number
        // Lock sequence row for current year
        const year = new Date().getFullYear();
        const seqRes = await client.query(
            `UPDATE invoice_sequences SET last_val = last_val + 1 WHERE year = $1 RETURNING last_val`,
            [year]
        );

        // Handle edge case if year doesn't exist yet (race condition possible but unlikely with initial migration)
        let seqVal;
        if (seqRes.rows.length === 0) {
            await client.query(`INSERT INTO invoice_sequences (year, last_val) VALUES ($1, 1)`, [year]);
            seqVal = 1;
        } else {
            seqVal = seqRes.rows[0].last_val;
        }

        const invoiceNumber = `INV-${year}-${String(seqVal).padStart(4, '0')}`;

        // 3. Update Invoice
        await client.query(
            `UPDATE invoices SET invoice_number = $1, status = 'finalized', finalized_at = NOW() WHERE invoice_id = $2`,
            [invoiceNumber, id]
        );

        await client.query('COMMIT');

        // 4. Generate PDF as base64 (no file storage)
        const fullInvoice = await getInvoiceDataInternal(id);
        const pdfResult = await generateInvoicePDF(fullInvoice);

        res.json({
            message: 'Invoice Finalized',
            invoice_number: invoiceNumber,
            pdf: {
                base64: pdfResult.base64,
                mimeType: pdfResult.mimeType,
                filename: pdfResult.filename
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error finalizing invoice' });
    } finally {
        client.release();
    }
};

// Helper to get full data (Optimized with Promise.all)
const getInvoiceDataInternal = async (id) => {
    // First batch: Get invoice and items in parallel
    const [invResult, itemsResult] = await Promise.all([
        pool.query(`SELECT * FROM invoices WHERE invoice_id = $1`, [id]),
        pool.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [id])
    ]);

    if (invResult.rows.length === 0) {
        throw new Error('Invoice not found');
    }

    const invoice = invResult.rows[0];

    // Second batch: Get patient and doctor in parallel (depends on first batch)
    const [patientResult, docResult] = await Promise.all([
        pool.query(`SELECT * FROM patients WHERE patient_id = $1`, [invoice.patient_id]),
        invoice.visit_id
            ? pool.query(`
                SELECT u.full_name FROM visits v 
                JOIN users u ON v.doctor_id = u.user_id 
                WHERE v.visit_id = $1
            `, [invoice.visit_id])
            : Promise.resolve({ rows: [] })
    ]);

    return {
        ...invoice,
        items: itemsResult.rows,
        patient: patientResult.rows[0],
        doctor: docResult.rows.length > 0 ? docResult.rows[0] : null
    };
};

const getInvoices = async (req, res) => {
    const { patient_id, page, limit = 20 } = req.query;
    try {
        let baseQuery = `FROM invoices i JOIN patients p ON i.patient_id = p.patient_id WHERE 1=1`;
        const params = [];

        if (patient_id) {
            params.push(patient_id);
            baseQuery += ` AND i.patient_id = $${params.length}`;
        }

        if (page) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / l);

            const dataQuery = `SELECT i.*, p.first_name, p.last_name ${baseQuery} ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            const result = await pool.query(dataQuery, [...params, l, offset]);

            return res.json({
                items: result.rows,
                pagination: { total, page: p, limit: l, totalPages }
            });
        }

        // Legacy
        const query = `SELECT i.*, p.first_name, p.last_name ${baseQuery} ORDER BY i.created_at DESC LIMIT 50`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('getInvoices Error:', err);
        res.status(500).json({ error: 'Server error accessing invoices' });
    }
};

const getInvoiceDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await getInvoiceDataInternal(id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const generatePDF = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await getInvoiceDataInternal(id);
        const pdfResult = await generateInvoicePDF(data);

        // Return base64 directly - frontend can convert to blob for download
        res.json({
            pdf: {
                base64: pdfResult.base64,
                mimeType: pdfResult.mimeType,
                filename: pdfResult.filename
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "PDF generation failed" });
    }
};

// Update Payment Status
const updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    try {
        const result = await pool.query(
            `UPDATE invoices SET payment_status = $1 WHERE invoice_id = $2 RETURNING *`,
            [payment_status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating payment status' });
    }
};

module.exports = { createInvoice, getInvoices, getInvoiceDetails, finalizeInvoice, generatePDF, updatePaymentStatus };
