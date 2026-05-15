const rateLimit = require('express-rate-limit');

// Limite stricte pour les routes d'authentification (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
    skipSuccessfulRequests: true, // ne compte que les échecs
});

// Limite globale API (protection DoS basique)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes. Veuillez patienter.' },
});

module.exports = { authLimiter, apiLimiter };
