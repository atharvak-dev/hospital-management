const pool = require('./config/db');

const migrate = async () => {
    try {
        await pool.query(`ALTER TABLE visits ADD COLUMN IF NOT EXISTS pre_op_instructions TEXT;`);
        console.log("Column 'pre_op_instructions' added successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
