const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// Upload Report
const uploadReport = async (req, res) => {
    const { patient_id, visit_id, test_name, notes, report_date } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO test_reports (patient_id, visit_id, test_name, report_date, file_path, notes, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                patient_id,
                visit_id || null,
                test_name,
                report_date || new Date(),
                file.filename, // Store filename, we serve from /uploads
                notes,
                req.user.user_id
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error uploading report' });
    }
};

// Get Reports for Patient
const getPatientReports = async (req, res) => {
    const { patientId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM test_reports WHERE patient_id = $1 ORDER BY report_date DESC, created_at DESC`,
            [patientId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete Report
const deleteReport = async (req, res) => {
    const { id } = req.params;
    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        // Get file path first
        const report = await client.query('SELECT file_path FROM test_reports WHERE report_id = $1', [id]);

        if (report.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }

        const filePath = path.join(__dirname, '../uploads', report.rows[0].file_path);

        // Delete from DB
        await client.query('DELETE FROM test_reports WHERE report_id = $1', [id]);

        await client.query('COMMIT');

        // Delete file (Only after DB commit success)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = { uploadReport, getPatientReports, deleteReport };
