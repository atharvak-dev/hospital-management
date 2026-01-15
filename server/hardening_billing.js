const { pool } = require('./config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Billing Hardening Migration...');
        await client.query('BEGIN');

        // 1. Create Sequences Table for Invoice Numbering
        console.log('Creating invoice_sequences table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoice_sequences (
                year INTEGER PRIMARY KEY,
                last_val INTEGER DEFAULT 0
            );
        `);

        // 2. Modify Invoices Table
        console.log('Updating invoices table schema...');

        // Add 'status' column if not exists
        // We use text/varchar instead of enum for easier migration in some PG setups, 
        // but let's stick to VARCHAR with CHECK constraint for simplicity and portability
        await client.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'voided')),
            ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP;
        `);

        // 3. Migrate Existing Invoices
        // Existing invoices are already "done", so we mark them as 'finalized'
        // and assume their invoice_number is valid (even if not strictly sequential in the new format)
        console.log('Migrating existing invoices...');
        await client.query(`
            UPDATE invoices 
            SET status = 'finalized', finalized_at = created_at 
            WHERE status IS NULL OR status = 'draft'; -- careful not to reset if ran twice
        `);

        // Also ensure current year exists in sequence
        const currentYear = new Date().getFullYear();
        await client.query(`
            INSERT INTO invoice_sequences (year, last_val) 
            VALUES ($1, 0)
            ON CONFLICT (year) DO NOTHING;
        `, [currentYear]);

        // 4. Update Sequence number to avoid collision if we switch format
        // If we want to strictly follow INV-YYYY-XXXX, we start from 0 for new ones.
        // Old invoices might have format 'INV123456'. That's fine, they are distinct.

        await client.query('COMMIT');
        console.log('Billing migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
