const pool = require('./config/db');

const migrate = async () => {
    try {
        // Add idempotency_key column with UNIQUE constraint
        await pool.query(`ALTER TABLE visits ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;`);
        console.log("Column 'idempotency_key' added successfully to 'visits' table.");
        process.exit(0);
    } catch (err) {
        console.error("Error adding column:", err);
        process.exit(1);
    }
};

migrate();
