const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoiceDetails, finalizeInvoice, generatePDF, updatePaymentStatus } = require('../controllers/billingController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Invoice creation open to admin/receptionist (they handle billing)
router.post('/', authorizeRoles('admin', 'receptionist'), createInvoice);
// Viewing open to all staff
router.get('/', getInvoices);
router.get('/:id', getInvoiceDetails);
// Finalize is a critical operation, admin/receptionist only
router.post('/:id/finalize', authorizeRoles('admin', 'receptionist'), finalizeInvoice);
router.get('/:id/pdf', generatePDF);
// Payment status updates are financial, restrict to admin/receptionist
router.patch('/:id/payment-status', authorizeRoles('admin', 'receptionist'), updatePaymentStatus);

module.exports = router;

