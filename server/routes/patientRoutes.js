const express = require('express');
const router = express.Router();
const { registerPatient, searchPatients, getPatient, updatePatient, linkFamilyMember } = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect all patient routes

// Registration: admin, receptionist, doctor (not nurse - they assist but don't register)
router.post('/', authorizeRoles('admin', 'receptionist', 'doctor'), registerPatient);
// Search and view open to all authenticated staff
router.get('/search', searchPatients);
router.get('/:id', getPatient);
// Update restricted to admin, receptionist, doctor
router.put('/:id', authorizeRoles('admin', 'receptionist', 'doctor'), updatePatient);
// Family linking: admin, receptionist, doctor
router.post('/link-family', authorizeRoles('admin', 'receptionist', 'doctor'), linkFamilyMember);

module.exports = router;

