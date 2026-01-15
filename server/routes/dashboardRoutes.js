const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/stats', authenticateToken, getDashboardStats);

module.exports = router;
