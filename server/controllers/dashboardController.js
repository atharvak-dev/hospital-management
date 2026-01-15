const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Single Query for Performance (Reduces DB round-trips from 7 to 1)
        const query = `
            SELECT
                (SELECT COUNT(*) FROM patients) as total_patients,
                (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
                (SELECT COUNT(*) FROM appointments WHERE appointment_date = $1) as appointments_today,
                (SELECT COUNT(*) FROM visits WHERE visit_date = $1) as visits_today,
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE payment_status = 'paid') as total_revenue,
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE payment_status = 'pending') as pending_payments
        `;

        const statsResult = await pool.query(query, [today]);
        const counts = statsResult.rows[0];

        // Group by status query (still lightweight, can keep separate or join if needed, but separate is fine for GroupBy)
        const apptStatusRes = await pool.query(
            'SELECT status, COUNT(*) as count FROM appointments WHERE appointment_date = $1 GROUP BY status',
            [today]
        );

        const stats = {
            total_patients: parseInt(counts.total_patients),
            total_doctors: parseInt(counts.total_doctors),
            appointments_today: parseInt(counts.appointments_today),
            visits_today: parseInt(counts.visits_today),
            total_revenue: parseFloat(counts.total_revenue),
            pending_payments: parseFloat(counts.pending_payments),
            appointment_stats: apptStatusRes.rows
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
};

module.exports = { getDashboardStats };
