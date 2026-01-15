const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadReport, getPatientReports, deleteReport } = require('../controllers/testReportController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authenticateToken);

// Upload open to all staff (nurses, receptionists can upload reports)
router.post('/upload', upload.single('file'), uploadReport);
// View open to all staff
router.get('/patient/:patientId', getPatientReports);
// Delete is destructive, restrict to admin/doctor only
router.delete('/:id', authorizeRoles('admin', 'doctor'), deleteReport);

module.exports = router;

