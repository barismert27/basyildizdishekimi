const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const verifyToken = require('../middlewares/authMiddleware');

// Public route'lar
router.post('/', appointmentController.createAppointment);
router.get('/tarih/:tarih', appointmentController.getTimesByDate);

// Protected route'lar (Admin yetkisi gerektirir)
router.get('/', verifyToken, appointmentController.getAllAppointments);
router.post('/admin', verifyToken, appointmentController.createAppointmentAdmin);
router.put('/admin/:id', verifyToken, appointmentController.updateAppointment);
router.put('/:id', verifyToken, appointmentController.updateAppointmentStatus);
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

module.exports = router;
