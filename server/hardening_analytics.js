const { pool } = require('./config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Analytics Hardening Migration...');
        await client.query('BEGIN');

        // Indexes for Report Performance
        console.log('Creating indexes for analytics...');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments (doctor_id, appointment_date);`);

        // Also useful for Visits table as reports join Visits too
        await client.query(`CREATE INDEX IF NOT EXISTS idx_visits_date_analytics ON visits (visit_date);`);

        await client.query('COMMIT');
        console.log('Analytics indexes created successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
