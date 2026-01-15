const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Register Patient
const registerPatient = async (req, res) => {
    const {
        first_name, last_name, date_of_birth, gender, blood_group,
        phone, alternate_phone, email, address, city, state, pincode,
        preferred_language, emergency_contact_name, emergency_contact_phone,
        allergies, chronic_conditions, family_medical_history
    } = req.body;

    try {
        // Generate a simple readable patient code (e.g., P-TIMESTAMP) - in real app use sequence
        const patient_code = 'P' + Date.now().toString().slice(-6);

        const result = await pool.query(
            `INSERT INTO patients (
                patient_code, first_name, last_name, date_of_birth, gender, blood_group, 
                phone, alternate_phone, email, address, city, state, pincode, 
                preferred_language, emergency_contact_name, emergency_contact_phone,
                allergies, chronic_conditions, family_medical_history, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
            RETURNING *`,
            [
                patient_code, first_name, last_name, date_of_birth, gender, blood_group,
                phone, alternate_phone, email, address, city, state, pincode,
                preferred_language || 'english', emergency_contact_name, emergency_contact_phone,
                allergies, chronic_conditions, family_medical_history, req.user.user_id
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Patient with this phone or code already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Search Patients
// Search Patients
const searchPatients = async (req, res) => {
    const { q, page, limit = 20 } = req.query;

    try {
        let baseQuery = `FROM patients WHERE 1=1`;
        const params = [];

        if (q) {
            params.push(`%${q}%`);
            baseQuery += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR patient_code ILIKE $${params.length})`;
        }

        // If pagination is requested
        if (page) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / l);

            // Fetch Data
            const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            const result = await pool.query(dataQuery, [...params, l, offset]);

            return res.json({
                items: result.rows,
                pagination: { total, page: p, limit: l, totalPages }
            });
        }

        // Legacy / Dropdown behavior (No page param)
        // Return latest 20 or matching top 20
        const result = await pool.query(
            `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT 20`,
            params
        );
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get Patient Details including specific history
const getPatient = async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await pool.query('SELECT * FROM patients WHERE patient_id = $1', [id]);
        if (patient.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

        // Get Visits History (Summary)
        const visits = await pool.query(
            `SELECT visit_id, visit_date, visit_type, doctor_id, diagnosis FROM visits 
             WHERE patient_id = $1 ORDER BY visit_date DESC LIMIT 5`,
            [id]
        );

        // Get Family Members
        // This is complex: check if patient is in any family, and then get all other members of that family
        const family = await pool.query(
            `SELECT p.patient_id, p.first_name, p.last_name, p.phone, pfm.relationship 
             FROM patient_family_members pfm
             JOIN patients p ON pfm.patient_id = p.patient_id
             WHERE pfm.family_id IN (SELECT family_id FROM patient_family_members WHERE patient_id = $1)
             AND p.patient_id != $1`,
            [id]
        );

        res.json({
            ...patient.rows[0],
            history: visits.rows,
            family: family.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Patient
const updatePatient = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    // Allowed fields to update
    const allowedFields = [
        'first_name', 'last_name', 'phone', 'alternate_phone', 'email',
        'address', 'city', 'state', 'pincode', 'emergency_contact_name',
        'emergency_contact_phone', 'allergies', 'chronic_conditions',
        'family_medical_history', 'blood_group' // added blood_group
    ];

    try {
        // Build dynamic query
        const updates = [];
        const values = [];
        let idx = 1;

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = $${idx}`);
                values.push(body[field]);
                idx++;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        const query = `UPDATE patients SET ${updates.join(', ')} WHERE patient_id = $${idx} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Link Family Member
const linkFamilyMember = async (req, res) => {
    // patient_id is the primary patient, member_id is the one to link
    const { patient_id, member_id, relationship } = req.body;

    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if primary patient has a family_id
        let familyResult = await client.query(
            `SELECT family_id FROM patient_family_members WHERE patient_id = $1`,
            [patient_id]
        );

        let family_id;

        if (familyResult.rows.length > 0) {
            family_id = familyResult.rows[0].family_id;
        } else {
            // Get patient name for family name
            const patientRes = await client.query('SELECT first_name, last_name FROM patients WHERE patient_id = $1', [patient_id]);
            const pName = patientRes.rows[0] ? `${patientRes.rows[0].first_name} ${patientRes.rows[0].last_name}` : 'Unknown';

            // Create new family
            const newFamily = await client.query(`INSERT INTO patient_families (family_name) VALUES ('Family of ' || $1) RETURNING family_id`, [pName]);
            family_id = newFamily.rows[0].family_id;
            // Add primary patient to this family
            await client.query(
                `INSERT INTO patient_family_members (family_id, patient_id, is_primary) VALUES ($1, $2, TRUE)`,
                [family_id, patient_id]
            );
        }

        // 2. Add member to family
        await client.query(
            `INSERT INTO patient_family_members (family_id, patient_id, relationship, is_primary) 
             VALUES ($1, $2, $3, FALSE) ON CONFLICT (family_id, patient_id) DO NOTHING`,
            [family_id, member_id, relationship]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Family member linked successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = { registerPatient, searchPatients, getPatient, updatePatient, linkFamilyMember };

