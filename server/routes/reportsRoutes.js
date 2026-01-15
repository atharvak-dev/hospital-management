const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/reportsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Only allow staff/doctors/admins to see reports, maybe restrict strict analytics to admin later
router.get('/dashboard', authenticateToken, getAnalytics);

module.exports = router;
