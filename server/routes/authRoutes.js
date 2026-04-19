const express = require('express');
const router = express.Router();
const { signup, register, login, getMe, getAllUsers, updateUser, deleteUser, approveUser } = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/register', authenticateToken, authorizeRoles('admin'), register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/approve/:id', authenticateToken, authorizeRoles('admin'), approveUser);
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

module.exports = router;
