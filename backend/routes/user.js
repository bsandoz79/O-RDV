const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');
const { getMe, uploadProfilePicture, updateProfile, changePassword, getAppointments, refuseAppointment, cancelAppointment, getDashboardStats, markAppointmentRead, getNewClients } = require('../controllers/userController');

router.get('/me', auth, getMe);
router.post('/profile-picture', auth, uploadAvatar.single('avatar'), uploadProfilePicture);
router.put('/update', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.get('/appointments', auth, getAppointments);
router.patch('/appointments/:id/refuse', auth, refuseAppointment);
router.patch('/appointments/:id/cancel', auth, cancelAppointment);
router.get('/dashboard-stats', auth, getDashboardStats);
router.patch('/appointments/:id/mark-read', auth, markAppointmentRead);
router.get('/new-clients', auth, getNewClients);

module.exports = router;
