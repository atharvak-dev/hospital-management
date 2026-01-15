const express = require('express');
const router = express.Router();
const { createVisit, getVisits, getVisitDetails } = require('../controllers/visitController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Only doctors can create visits
router.post('/', authorizeRoles('doctor'), createVisit);
// All authenticated staff can view visits
router.get('/', getVisits); // ?date=YYYY-MM-DD
router.get('/:id', getVisitDetails);

module.exports = router;

