const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');
const { getMe, uploadProfilePicture, updateProfile, changePassword, getAppointments, refuseAppointment, cancelAppointment, getDashboardStats, markAppointmentRead, getNewClients } = require('../controllers/userController');

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `avatar_${req.auth.userId}_${Date.now()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Seules les images sont acceptées.'));
    },
});

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
