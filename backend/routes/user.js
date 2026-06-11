const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');
const { getMe, uploadProfilePicture, updateProfile, changePassword, getAppointments, refuseAppointment, cancelAppointment, getDashboardStats, markAppointmentRead, getNewClients, deleteAccount } = require('../controllers/userController');
const { validateUpdateProfile, validateChangePassword, validateRefuseAppointment } = require('../middlewares/validate');

router.get('/me',              auth, getMe);
router.post('/profile-picture', auth, (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('[Cloudinary avatar error]', err.message);
            return res.status(500).json({ error: 'Erreur upload avatar : ' + err.message });
        }
        next();
    });
}, uploadProfilePicture);
router.put('/update',                       auth, validateUpdateProfile,   updateProfile);
router.put('/change-password',              auth, validateChangePassword,  changePassword);
router.get('/appointments',                 auth, getAppointments);
router.patch('/appointments/:id/refuse',    auth, validateRefuseAppointment, refuseAppointment);
router.patch('/appointments/:id/cancel',    auth, cancelAppointment);
router.get('/dashboard-stats',              auth, getDashboardStats);
router.patch('/appointments/:id/mark-read', auth, markAppointmentRead);
router.get('/new-clients',                  auth, getNewClients);
router.delete('/account',                   auth, deleteAccount);

module.exports = router;
