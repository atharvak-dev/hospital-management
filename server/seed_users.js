const pool = require('./config/db');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const users = [
    { username: 'admin', password: 'password123', full_name: 'Admin User', role: 'admin', email: 'admin@hospital.com', phone: '1111111111' },
    { username: 'doctor', password: 'password123', full_name: 'Dr. Smith', role: 'doctor', email: 'doctor@hospital.com', phone: '2222222222' },
    { username: 'nurse', password: 'password123', full_name: 'Nurse Joy', role: 'nurse', email: 'nurse@hospital.com', phone: '3333333333' },
    { username: 'reception', password: 'password123', full_name: 'Receptionist Sarah', role: 'receptionist', email: 'reception@hospital.com', phone: '4444444444' }
];

const seedUsers = async () => {
    console.log('Seeding users...');
    try {
        for (const user of users) {
            // Check if user exists
            const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [user.username]);
            if (userCheck.rows.length > 0) {
                console.log(`User ${user.username} already exists. Skipping.`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(user.password, salt);

            await pool.query(
                `INSERT INTO users (username, password_hash, full_name, email, phone, role) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.username, passwordHash, user.full_name, user.email, user.phone, user.role]
            );
            console.log(`User ${user.username} created.`);
        }
    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        pool.end(); // Close connection
        process.exit();
    }
};

seedUsers();
