const pool = require('./config/db');

const migrate = async () => {
    try {
        await pool.query(`ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS reminders TEXT;`);
        console.log("Column 'reminders' added successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
