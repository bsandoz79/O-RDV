const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { googleRedirect, googleCallback } = require('../controllers/googleAuthController');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin } = require('../middlewares/validate');

router.post('/register', authLimiter, validateRegister, register);
router.post('/login',    authLimiter, validateLogin,    login);
router.post('/logout',   logout);

router.get('/google',          googleRedirect);
router.get('/google/callback', googleCallback);

module.exports = router;
