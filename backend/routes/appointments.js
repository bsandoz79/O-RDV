const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { createAppointment, getAvailability, getServices } = require('../controllers/appointmentController');
const { validateCreateAppointment, validateAvailability } = require('../middlewares/validate');

router.post('/',                           auth, checkRole(['user', 'admin']), validateCreateAppointment, createAppointment);
router.get('/availability/:providerId/:date', validateAvailability, getAvailability);
router.get('/services',                    getServices);

module.exports = router;
