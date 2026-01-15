const { pool } = require('./config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Appointment Hardening Migration...');
        await client.query('BEGIN');

        // 1. Unique Index for Conflict Detection
        // Prevent duplicate appointments for the same doctor at the same time, unless cancelled.
        console.log('Creating unique index on appointments...');
        // We use a partial index to allow multiple 'cancelled' appointments at the same slot if needed, 
        // but only ONE active (scheduled/confirmed/in-progress/completed) appointment.
        // Note: appointment_time is TIME type, appointment_date is DATE.
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_conflict 
            ON appointments (doctor_id, appointment_date, appointment_time) 
            WHERE status NOT IN ('cancelled', 'no-show', 'completed');
        `);
        // Actually, 'completed' appointments also consume the slot. 
        // We should protects against overlap for FUTURE/CURRENT appointments.
        // If a slot is 'completed', can another patient book it? No.
        // So strict uniqueness on (doctor, date, time) where status != 'cancelled'.

        await client.query(`
            DROP INDEX IF EXISTS idx_appointment_conflict;
            CREATE UNIQUE INDEX idx_appointment_conflict 
            ON appointments (doctor_id, appointment_date, appointment_time) 
            WHERE status != 'cancelled';
        `);

        // 2. Ensure Queue Table Constraints
        console.log('Ensuring Queue Table constraints...');
        await client.query(`
            ALTER TABLE appointment_queue 
            DROP CONSTRAINT IF EXISTS unique_queue_per_day;
            
            -- Ensure unique queue number per doctor per day
            -- This might be tricky if we want strictly sequential, but unique index helps.
            -- We just need to ensure an appointment doesn't get two queue entries.
            CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_appointment 
            ON appointment_queue (appointment_id);
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
