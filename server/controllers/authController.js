const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user (Usually done by admin, but allowing initial creation for now)
const register = async (req, res) => {
    const { username, password, full_name, email, phone, role } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            `INSERT INTO users (username, password_hash, full_name, email, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, username, role`,
            [username, passwordHash, full_name, email, phone, role || 'staff']
        );

        res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login User
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const payload = {
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get Current User
const getMe = async (req, res) => {
    try {
        const user = await pool.query('SELECT user_id, username, full_name, role, email, phone FROM users WHERE user_id = $1', [req.user.user_id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All Users (Admin only)
const getAllUsers = async (req, res) => {
    const { page, limit = 20 } = req.query;
    try {
        let baseQuery = `FROM users`;

        if (page) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`);
            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / l);

            const dataQuery = `SELECT user_id, username, full_name, role, email, phone ${baseQuery} ORDER BY user_id DESC LIMIT $1 OFFSET $2`;
            const users = await pool.query(dataQuery, [l, offset]);

            return res.json({
                items: users.rows,
                pagination: { total, page: p, limit: l, totalPages }
            });
        }

        const users = await pool.query('SELECT user_id, username, full_name, role, email, phone FROM users ORDER BY user_id DESC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login, getMe, getAllUsers };
