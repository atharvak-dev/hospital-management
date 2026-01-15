const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        // 1. Seed Admin User
        const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        if (adminCheck.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, full_name, email, role) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['admin', hash, 'System Admin', 'admin@hospital.com', 'admin']
            );
            console.log('Admin user created (admin / admin123)');
        } else {
            console.log('Admin user already exists');
        }

        // 2. Seed Common Medicines
        const medCheck = await pool.query("SELECT * FROM medicines LIMIT 1");
        if (medCheck.rows.length === 0) {
            console.log("Seeding medicines...");
            await pool.query(`
                INSERT INTO medicines (medicine_name, generic_name, type, strength, default_dosage, default_frequency, default_duration) VALUES 
                ('Paracetamol', 'Paracetamol', 'tablet', '500mg', '1 tablet', '1-0-1', '3 days'),
                ('Amoxicillin', 'Amoxicillin', 'capsule', '500mg', '1 capsule', '1-0-1', '5 days'),
                ('Cetirizine', 'Cetirizine', 'tablet', '10mg', '1 tablet', '0-0-1', '3 days'),
                ('Pantoprazole', 'Pantoprazole', 'tablet', '40mg', '1 tablet', '1-0-0', '5 days (before food)'),
                ('Ibuprofen', 'Ibuprofen', 'tablet', '400mg', '1 tablet', '1-0-1', '3 days (after food)')
            `);
            console.log("Medicines seeded.");
        }

        console.log("Seeding completed.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
