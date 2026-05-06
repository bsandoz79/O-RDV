const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { createAppointment, getAvailability, getServices } = require('../controllers/appointmentController');

router.post('/', auth, checkRole(['user', 'admin']), createAppointment);
router.get('/availability/:providerId/:date', getAvailability);
router.get('/services', getServices);

module.exports = router;
