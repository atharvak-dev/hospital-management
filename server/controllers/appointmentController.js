const { pool } = require('../config/db');

// Helper to validate time (Simple check, assumes server time is source of truth for now)
const isFutureSlot = (date, time) => {
    const slotDate = new Date(`${date}T${time}`);
    const now = new Date();
    return slotDate > now;
};

// Book Appointment with Transaction & Locking
const bookAppointment = async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time, appointment_type, notes } = req.body;

    // 1. Basic Validation
    if (!isFutureSlot(appointment_date, appointment_time)) {
        return res.status(400).json({ error: 'Cannot book appointments in the past.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. Generate Appointment Number
        const appointment_number = 'A' + Date.now().toString().slice(-6);

        // 3. Queue Generation (Atomic Lock)
        // Lock the queue table for this doctor/date to prevent race conditions on queue_number
        // We select the max queue number for update. 
        // Note: appointment_queue table might be empty for the day, so COALESCE handles null.
        // We limit 1 just to be safe syntax-wise but aggregate returns 1 row.
        // 3. Queue Generation (Atomic Lock)
        // Note: Using optimistic approach without FOR UPDATE on AGGREGATE (which is invalid in PG)
        // We will just count existing appointments for this doctor/date to determine queue number.
        // A strict sequential queue is nice but simple count is sufficient for now.
        const qRes = await client.query(
            `SELECT COUNT(*) + 1 as next_queue FROM appointments 
             WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'`,
            [doctor_id, appointment_date]
        );
        const nextQueueNumber = parseInt(qRes.rows[0].next_queue);


        // 4. Insert Appointment
        // This will FAIL if Unique Index (doctor, date, time) exists and is violated.
        const apptRes = await client.query(
            `INSERT INTO appointments (
                appointment_number, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, notes, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8) RETURNING *`,
            [appointment_number, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, notes, req.user.user_id]
        );
        const appointment = apptRes.rows[0];

        // 5. Insert into Queue
        await client.query(
            `INSERT INTO appointment_queue (appointment_id, queue_number, queue_date, status)
             VALUES ($1, $2, $3, 'waiting')`,
            [appointment.appointment_id, nextQueueNumber, appointment_date]
        );

        await client.query('COMMIT');
        res.status(201).json({ ...appointment, queue_number: nextQueueNumber });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') { // Unique constraint violation code
            return res.status(409).json({ error: 'Slot conflict: Doctor is already booked at this time.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error during booking.' });
    } finally {
        client.release();
    }
};

// Get Appointments with Queue Info & Pagination
const getAppointments = async (req, res) => {
    const { date, startDate, endDate, doctor_id, status, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build Where Clause
    let conditions = [];
    const params = [];

    if (startDate && endDate) {
        params.push(startDate);
        params.push(endDate);
        conditions.push(`a.appointment_date BETWEEN $${params.length - 1} AND $${params.length}`);
    } else if (date) {
        params.push(date);
        conditions.push(`a.appointment_date = $${params.length}`);
    }

    if (doctor_id) {
        params.push(doctor_id);
        conditions.push(`a.doctor_id = $${params.length}`);
    } else if (req.user.role === 'doctor') {
        params.push(req.user.user_id);
        conditions.push(`a.doctor_id = $${params.length}`);
    }

    if (status) {
        params.push(status);
        conditions.push(`a.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    try {
        // 1. Get Total Count
        const countQuery = `SELECT COUNT(*) FROM appointments a ${whereClause}`;
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);

        // 2. Get Data
        const dataQuery = `
            SELECT 
                a.appointment_id, a.appointment_number, a.patient_id, a.doctor_id, 
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date, 
                a.appointment_time, a.appointment_type, a.notes, a.status, 
                a.created_by, a.created_at, a.updated_at,
                p.first_name, p.last_name, p.phone, p.patient_code, 
                aq.queue_number, aq.status as queue_status
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN appointment_queue aq ON a.appointment_id = aq.appointment_id
            ${whereClause}
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const result = await pool.query(dataQuery, [...params, limitNum, offset]);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: pageNum,
                totalPages,
                limit: limitNum
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Appointment & Queue Status
const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // scheduled, confirmed, in-progress, completed, cancelled, no-show

    // Map Appointment Status to Queue Status
    const queueStatusMap = {
        'in-progress': 'called',
        'completed': 'completed',
        'cancelled': 'cancelled', // or remove from queue logic?
        'no-show': 'skipped'
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update Appointment
        const result = await client.query(
            `UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            throw new Error('Appointment not found');
        }

        // Update Queue if applicable
        if (queueStatusMap[status]) {
            let qQuery = `UPDATE appointment_queue SET status = $1`;
            if (status === 'in-progress') qQuery += `, called_at = CURRENT_TIMESTAMP`;
            if (status === 'completed') qQuery += `, completed_at = CURRENT_TIMESTAMP`;

            qQuery += ` WHERE appointment_id = $2`;

            await client.query(qQuery, [queueStatusMap[status], id]);
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error updating status' });
    } finally {
        client.release();
    }
};

module.exports = { bookAppointment, getAppointments, updateAppointmentStatus };
