const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Public signup — sets status=pending
const signup = async (req, res) => {
    const { username, password, full_name, email, phone, role } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ error: 'Username or Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, email, phone, role, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [username, passwordHash, full_name, email, phone, role || 'staff']
        );

        res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin-created user — status=approved by default
const register = async (req, res) => {
    const { username, password, full_name, email, phone, role } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ error: 'Username or Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            `INSERT INTO users (username, password_hash, full_name, email, phone, role, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'approved') RETURNING user_id, username, role`,
            [username, passwordHash, full_name, email, phone, role || 'staff']
        );
        res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Approve or reject user (admin only, called from UI)
const approveUser = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action.' });
    try {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const result = await pool.query(
            `UPDATE users SET status = $1 WHERE user_id = $2 RETURNING user_id, username, full_name, status`,
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: `User ${status}.`, user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login — checks status
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        if (userResult.rows.length === 0) return res.status(400).json({ error: 'Invalid Credentials' });

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

        if (user.status === 'pending')  return res.status(403).json({ error: 'pending', message: 'Your account is awaiting admin approval.' });
        if (user.status === 'rejected') return res.status(403).json({ error: 'rejected', message: 'Your account has been rejected by the admin.' });

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ token, user: { user_id: user.user_id, username: user.username, full_name: user.full_name, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get current user
const getMe = async (req, res) => {
    try {
        const user = await pool.query('SELECT user_id, username, full_name, role, email, phone FROM users WHERE user_id = $1', [req.user.user_id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    const { page, limit = 20 } = req.query;
    try {
        const baseQuery = `FROM users`;
        if (page) {
            const p = parseInt(page), l = parseInt(limit), offset = (p - 1) * l;
            const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`);
            const total = parseInt(countResult.rows[0].count);
            const users = await pool.query(
                `SELECT user_id, username, full_name, role, email, phone, status ${baseQuery} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [l, offset]
            );
            return res.json({ items: users.rows, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
        }
        const users = await pool.query('SELECT user_id, username, full_name, role, email, phone, status FROM users ORDER BY created_at DESC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, role, password } = req.body;
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.user_id === id;
    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Access denied.' });
    if (role && !isAdmin) return res.status(403).json({ error: 'Only admin can change roles.' });

    try {
        const fields = [], values = [];
        let i = 1;
        if (full_name) { fields.push(`full_name = $${i++}`); values.push(full_name); }
        if (email)     { fields.push(`email = $${i++}`);     values.push(email); }
        if (phone)     { fields.push(`phone = $${i++}`);     values.push(phone); }
        if (role && isAdmin) { fields.push(`role = $${i++}`); values.push(role); }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            fields.push(`password_hash = $${i++}`);
            values.push(await bcrypt.hash(password, salt));
        }
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
        values.push(id);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${i} RETURNING user_id, username, full_name, role, email, phone`,
            values
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
    const { id } = req.params;
    if (req.user.user_id === id) return res.status(400).json({ error: 'Cannot delete your own account.' });
    try {
        const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { signup, register, login, getMe, getAllUsers, updateUser, deleteUser, approveUser };
