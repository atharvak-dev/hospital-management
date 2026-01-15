const pool = require('../config/db');

// Create Visit
// Create Visit
const createVisit = async (req, res) => {
    const {
        patient_id, doctor_id, visit_type, symptoms,
        vital_signs,
        diagnosis, advice, follow_up_date, follow_up_instructions,
        tests // array of strings (test names)
    } = req.body;

    const idempotencyKey = req.headers['idempotency-key'];
    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        const visit_number = 'V' + Date.now().toString().slice(-6);
        const docId = req.user.role === 'doctor' ? req.user.user_id : (doctor_id || req.user.user_id);

        const result = await client.query(
            `INSERT INTO visits (
                visit_number, patient_id, doctor_id, visit_type, symptoms, 
                vital_signs, diagnosis, advice, follow_up_date, follow_up_instructions, pre_op_instructions, status, idempotency_key
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed', $12) 
            RETURNING *`,
            [
                visit_number, patient_id, docId, visit_type, symptoms,
                vital_signs, diagnosis, advice, follow_up_date, follow_up_instructions, req.body.pre_op_instructions, idempotencyKey
            ]
        );

        const newVisit = result.rows[0];

        // Insert Tests if any (Bulk Insert)
        if (tests && tests.length > 0) {
            const testValues = [];
            let placeholderIndex = 1;
            const placeholders = tests.map(test => {
                const name = test.name || test;
                const urgent = test.is_urgent || false;
                testValues.push(newVisit.visit_id, name, urgent);
                return `($${placeholderIndex++}, $${placeholderIndex++}, $${placeholderIndex++})`;
            }).join(', ');

            await client.query(
                `INSERT INTO test_recommendations (visit_id, test_name, is_urgent) VALUES ${placeholders}`,
                testValues
            );
        }

        await client.query('COMMIT');
        res.status(201).json(newVisit);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505' && err.constraint && err.constraint.includes('idempotency_key')) {
            // Unique violation on idempotency_key
            console.log('Duplicate visit blocked by idempotency key:', idempotencyKey);
            return res.status(409).json({ error: 'Duplicate request detected' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

// Get Doctor's Visits (for today or history)
const getVisits = async (req, res) => {
    const { date, patient_id, doctor_id, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
        FROM visits v 
        JOIN patients p ON v.patient_id = p.patient_id 
        LEFT JOIN users u ON v.doctor_id = u.user_id
        WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'doctor') {
        params.push(req.user.user_id);
        baseQuery += ` AND v.doctor_id = $${params.length}`;
    } else if (doctor_id) {
        params.push(doctor_id);
        baseQuery += ` AND v.doctor_id = $${params.length}`;
    }

    if (date) {
        params.push(date);
        baseQuery += ` AND v.visit_date = $${params.length}`;
    }

    if (patient_id) {
        params.push(patient_id);
        baseQuery += ` AND v.patient_id = $${params.length}`;
    }

    if (status) {
        params.push(status);
        baseQuery += ` AND v.status = $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        baseQuery += ` AND (p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR p.phone ILIKE $${params.length} OR p.patient_code ILIKE $${params.length})`;
    }

    // Count Query
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;

    // Data Query
    const dataQuery = `
        SELECT v.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.patient_code, u.full_name as doctor_name 
        ${baseQuery}
        ORDER BY v.visit_date DESC, v.visit_time DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    try {
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        const result = await pool.query(dataQuery, [...params, limit, offset]);

        res.json({
            items: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getVisitDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const visit = await pool.query(
            `SELECT v.*, p.first_name, p.last_name, p.gender, p.date_of_birth, p.patient_code,
             u.full_name as doctor_name
             FROM visits v
             JOIN patients p ON v.patient_id = p.patient_id
             LEFT JOIN users u ON v.doctor_id = u.user_id
             WHERE v.visit_id = $1`,
            [id]
        );

        if (visit.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });

        // Fetch Prescriptions and Tests in parallel (Optimized)
        const [prescriptions, tests] = await Promise.all([
            // Using JOIN instead of subquery for better performance
            pool.query(
                `SELECT pi.* FROM prescription_items pi
                 JOIN prescriptions p ON pi.prescription_id = p.prescription_id
                 WHERE p.visit_id = $1`,
                [id]
            ),
            pool.query(
                `SELECT * FROM test_recommendations WHERE visit_id = $1`,
                [id]
            )
        ]);

        res.json({
            visit: visit.rows[0],
            prescriptions: prescriptions.rows,
            tests: tests.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createVisit, getVisits, getVisitDetails };
