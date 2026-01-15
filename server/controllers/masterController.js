const pool = require('../config/db');

const getAllMedicines = async (req, res) => {
    const { page, limit = 10 } = req.query;
    try {
        if (page) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const countResult = await pool.query('SELECT COUNT(*) FROM medicines WHERE is_active = TRUE');
            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / l);

            const result = await pool.query('SELECT * FROM medicines WHERE is_active = TRUE ORDER BY medicine_name LIMIT $1 OFFSET $2', [l, offset]);

            return res.json({
                data: result.rows,
                pagination: { total, page: p, limit: l, totalPages }
            });
        }

        const result = await pool.query('SELECT * FROM medicines WHERE is_active = TRUE ORDER BY medicine_name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const addMedicine = async (req, res) => {
    const { medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration, instructions } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO medicines (medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration, instructions) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration, instructions]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const updateMedicine = async (req, res) => {
    const { id } = req.params;
    const { medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration, instructions } = req.body;
    try {
        const result = await pool.query(
            `UPDATE medicines SET medicine_name=$1, generic_name=$2, type=$3, strength=$4, default_dosage=$5, default_frequency=$6, default_duration=$7, instructions=$8, updated_at=CURRENT_TIMESTAMP 
             WHERE medicine_id=$9 RETURNING *`,
            [medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration, instructions, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Medicine not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const searchMedicines = async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM medicines WHERE is_active = TRUE AND (medicine_name ILIKE $1 OR generic_name ILIKE $1)`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const getTemplates = async (req, res) => {
    const { page, limit = 20 } = req.query;
    try {
        let baseQuery = `FROM templates WHERE is_active = TRUE AND (is_global = TRUE OR doctor_id = $1)`;
        const params = [req.user.user_id];

        if (page) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / l);

            const dataQuery = `SELECT * ${baseQuery} ORDER BY template_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            const result = await pool.query(dataQuery, [...params, l, offset]);

            return res.json({
                items: result.rows,
                pagination: { total, page: p, limit: l, totalPages }
            });
        }

        const result = await pool.query(
            `SELECT * ${baseQuery} ORDER BY template_name`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const createTemplate = async (req, res) => {
    const { template_name, template_type, content, language, is_global } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO templates (template_name, template_type, content, language, is_global, doctor_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [template_name, template_type, content, language, is_global || false, req.user.user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const updateTemplate = async (req, res) => {
    const { id } = req.params;
    const { template_name, template_type, content, is_global } = req.body;
    try {
        const result = await pool.query(
            `UPDATE templates SET template_name=$1, template_type=$2, content=$3, is_global=$4, updated_at=CURRENT_TIMESTAMP 
             WHERE template_id=$5 RETURNING *`,
            [template_name, template_type, content, is_global || false, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteTemplate = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM templates WHERE template_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const getDoctors = async (req, res) => {
    try {
        const result = await pool.query("SELECT user_id, full_name FROM users WHERE role = 'doctor'");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAllMedicines, addMedicine, updateMedicine, searchMedicines,
    getTemplates, createTemplate, updateTemplate, deleteTemplate,
    getDoctors
};
