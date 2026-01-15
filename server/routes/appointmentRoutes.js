const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Booking: admin, receptionist, doctor
router.post('/', authorizeRoles('admin', 'receptionist', 'doctor'), bookAppointment);
// Viewing open to all authenticated staff
router.get('/', getAppointments);
// Status update: admin, receptionist, doctor (not nurse)
router.put('/:id/status', authorizeRoles('admin', 'receptionist', 'doctor'), updateAppointmentStatus);

module.exports = router;

