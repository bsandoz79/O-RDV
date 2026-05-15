const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { googleRedirect, googleCallback } = require('../controllers/googleAuthController');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

module.exports = router;
