const pool = require('../config/db');

// Add Prescription to a Visit
const createPrescription = async (req, res) => {
    const { visit_id, items } = req.body;
    // items: [{ medicine_id, medicine_name, dosage, frequency, duration, timing, special_instructions }]

    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create Prescription Header
        const presNum = 'PR' + Date.now().toString().slice(-6);
        const presResult = await client.query(
            `INSERT INTO prescriptions (visit_id, prescription_number) VALUES ($1, $2) RETURNING prescription_id`,
            [visit_id, presNum]
        );
        const prescription_id = presResult.rows[0].prescription_id;

        // 2. Insert Items (Bulk Insert for Performance)
        if (items.length > 0) {
            const itemValues = [];
            let placeholderIndex = 1;
            const placeholders = items.map(item => {
                itemValues.push(
                    prescription_id, item.medicine_id, item.medicine_name,
                    item.dosage, item.frequency, item.duration, item.timing, item.special_instructions, item.reminders
                );
                const p = `($${placeholderIndex}, $${placeholderIndex + 1}, $${placeholderIndex + 2}, $${placeholderIndex + 3}, $${placeholderIndex + 4}, $${placeholderIndex + 5}, $${placeholderIndex + 6}, $${placeholderIndex + 7}, $${placeholderIndex + 8})`;
                placeholderIndex += 9;
                return p;
            }).join(', ');

            await client.query(
                `INSERT INTO prescription_items (prescription_id, medicine_id, medicine_name, dosage, frequency, duration, timing, special_instructions, reminders) 
                 VALUES ${placeholders}`,
                itemValues
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Prescription created', prescription_id, prescription_number: presNum });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

// Get Prescription for a Visit
const getPrescriptionByVisit = async (req, res) => {
    const { visitId } = req.params;
    try {
        const presResult = await pool.query(
            `SELECT * FROM prescriptions WHERE visit_id = $1`,
            [visitId]
        );

        if (presResult.rows.length === 0) return res.json(null);

        const prescription = presResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT * FROM prescription_items WHERE prescription_id = $1`,
            [prescription.prescription_id]
        );

        res.json({
            ...prescription,
            items: itemsResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createPrescription, getPrescriptionByVisit };
