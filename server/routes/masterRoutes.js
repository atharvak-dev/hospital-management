const express = require('express');
const router = express.Router();
const { getAllMedicines, addMedicine, updateMedicine, searchMedicines, getTemplates, createTemplate, updateTemplate, deleteTemplate } = require('../controllers/masterController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Medicines
router.get('/medicines', authenticateToken, getAllMedicines);
router.get('/medicines/search', authenticateToken, searchMedicines);
router.post('/medicines', authenticateToken, authorizeRoles('admin', 'doctor'), addMedicine);
router.put('/medicines/:id', authenticateToken, authorizeRoles('admin', 'doctor'), updateMedicine);

// Templates
router.get('/templates', authenticateToken, getTemplates);
router.post('/templates', authenticateToken, authorizeRoles('doctor', 'admin'), createTemplate);
router.put('/templates/:id', authenticateToken, authorizeRoles('doctor', 'admin'), updateTemplate);
router.delete('/templates/:id', authenticateToken, authorizeRoles('doctor', 'admin'), deleteTemplate);

// Output Routes
const { generateWhatsAppText } = require('../controllers/whatsappController');
router.post('/share/whatsapp-text', authenticateToken, generateWhatsAppText);

// Doctors List
const { getDoctors } = require('../controllers/masterController');
router.get('/doctors', authenticateToken, getDoctors);

module.exports = router;
