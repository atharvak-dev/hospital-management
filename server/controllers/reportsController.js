const { pool } = require('../config/db');

const getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Expect YYYY-MM-DD

        const filterStart = startDate || new Date().toISOString().split('T')[0];
        const filterEnd = endDate || new Date().toISOString().split('T')[0];

        // 1. Basic Stats (Visits, Revenue, Patients)
        const [
            visitCountRes,
            revenueRes,
            patientCountRes
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM visits WHERE visit_date >= $1 AND visit_date <= $2', [filterStart, filterEnd]),
            pool.query('SELECT SUM(total_amount) FROM invoices WHERE invoice_date >= $1 AND invoice_date <= $2', [filterStart, filterEnd]),
            pool.query('SELECT COUNT(*) FROM patients') // Total patients is absolute
        ]);

        // 2. Appointment Analytics & KPIs
        // Breakdown by status
        const apptStatsRes = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date >= $1 AND appointment_date <= $2
            GROUP BY status
        `, [filterStart, filterEnd]);

        const apptStats = apptStatsRes.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, { scheduled: 0, confirmed: 0, 'in-progress': 0, completed: 0, cancelled: 0, 'no-show': 0 });

        const totalAppts = Object.values(apptStats).reduce((a, b) => a + b, 0);

        // Cancellation Rate: Cancelled / Total (excluding drafts if any, but we don;t have drafts)
        const cancellationRate = totalAppts > 0 ? ((apptStats.cancelled / totalAppts) * 100).toFixed(1) : 0;
        const noShowRate = totalAppts > 0 ? ((apptStats['no-show'] / totalAppts) * 100).toFixed(1) : 0;

        // 3. Daily Patient Count per Doctor
        const dailyDoctorStatsRes = await pool.query(`
            SELECT u.full_name as doctor_name, a.appointment_date, COUNT(*) as count
            FROM appointments a
            JOIN users u ON a.doctor_id = u.user_id
            WHERE a.appointment_date >= $1 AND a.appointment_date <= $2
            GROUP BY u.full_name, a.appointment_date
            ORDER BY a.appointment_date, u.full_name
        `, [filterStart, filterEnd]);

        // 4. Top Doctor (Summary for range)
        const doctorStats = await pool.query(`
            SELECT u.full_name as doctor_name, COUNT(v.visit_id) as visit_count
            FROM visits v
            JOIN users u ON v.doctor_id = u.user_id
            WHERE v.visit_date >= $1 AND v.visit_date <= $2
            GROUP BY u.full_name
            ORDER BY visit_count DESC
            LIMIT 5
        `, [filterStart, filterEnd]);

        res.json({
            range: { start: filterStart, end: filterEnd },
            summary: {
                total_visits: parseInt(visitCountRes.rows[0].count),
                total_revenue: parseFloat(revenueRes.rows[0].sum || 0),
                total_patients: parseInt(patientCountRes.rows[0].count)
            },
            appointment_analytics: {
                breakdown: apptStats,
                total: totalAppts,
                metrics: {
                    cancellation_rate: parseFloat(cancellationRate),
                    no_show_rate: parseFloat(noShowRate)
                }
            },
            daily_stats: dailyDoctorStatsRes.rows, // For charts/export
            top_doctors: doctorStats.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

module.exports = { getAnalytics };
