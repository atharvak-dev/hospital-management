const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionByVisit } = require('../controllers/prescriptionController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', authorizeRoles('doctor'), createPrescription);
router.get('/visit/:visitId', getPrescriptionByVisit);

module.exports = router;
