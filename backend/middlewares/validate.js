const { validationResult, body, param, query } = require('express-validator');

// Middleware qui vérifie les erreurs et coupe la requête si invalide
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────

const validateRegister = [
    body('email')
        .isEmail().withMessage("Format d'email invalide.")
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage("Le mot de passe doit faire au moins 8 caractères.")
        .matches(/[A-Z]/).withMessage("Le mot de passe doit contenir au moins une majuscule.")
        .matches(/[0-9]/).withMessage("Le mot de passe doit contenir au moins un chiffre."),
    body('role')
        .optional()
        .isIn(['user', 'pro']).withMessage("Rôle invalide."),
    validate,
];

const validateLogin = [
    body('email')
        .isEmail().withMessage("Format d'email invalide.")
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage("Le mot de passe est obligatoire."),
    validate,
];

// ── User ──────────────────────────────────────────────────────────────────────

const validateUpdateProfile = [
    body('email')
        .isEmail().withMessage("Format d'email invalide.")
        .normalizeEmail(),
    body('first_name')
        .optional({ nullable: true })
        .isLength({ max: 50 }).withMessage("Prénom trop long (50 caractères max)."),
    body('last_name')
        .optional({ nullable: true })
        .isLength({ max: 50 }).withMessage("Nom trop long (50 caractères max)."),
    body('phone')
        .optional({ nullable: true })
        .matches(/^[0-9+\s\-().]{7,20}$/).withMessage("Numéro de téléphone invalide."),
    validate,
];

const validateChangePassword = [
    body('current_password')
        .notEmpty().withMessage("Le mot de passe actuel est obligatoire."),
    body('new_password')
        .isLength({ min: 8 }).withMessage("Le mot de passe doit faire au moins 8 caractères.")
        .matches(/[A-Z]/).withMessage("Le mot de passe doit contenir au moins une majuscule.")
        .matches(/[0-9]/).withMessage("Le mot de passe doit contenir au moins un chiffre."),
    validate,
];

const validateRefuseAppointment = [
    param('id')
        .isInt({ min: 1 }).withMessage("ID de rendez-vous invalide."),
    body('reason')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage("Raison trop longue (500 caractères max)."),
    body('release')
        .optional()
        .isBoolean().withMessage("Le champ release doit être un booléen."),
    validate,
];

// ── Rendez-vous ───────────────────────────────────────────────────────────────

const validateCreateAppointment = [
    body('provider_id')
        .isInt({ min: 1 }).withMessage("provider_id invalide."),
    body('service_id')
        .isInt({ min: 1 }).withMessage("service_id invalide."),
    body('appointment_date')
        .isISO8601().withMessage("Date de rendez-vous invalide."),
    body('phone')
        .optional({ nullable: true })
        .matches(/^[0-9+\s\-().]{7,20}$/).withMessage("Numéro de téléphone invalide."),
    body('send_sms_reminder')
        .optional()
        .isBoolean().withMessage("send_sms_reminder doit être un booléen."),
    validate,
];

const validateAvailability = [
    param('providerId')
        .isInt({ min: 1 }).withMessage("providerId invalide."),
    param('date')
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Format de date invalide (YYYY-MM-DD)."),
    query('duration')
        .optional()
        .isInt({ min: 5, max: 480 }).withMessage("Durée invalide."),
    validate,
];

// ── Avis ──────────────────────────────────────────────────────────────────────

const validateCreateReview = [
    body('appointment_id')
        .isInt({ min: 1 }).withMessage("appointment_id invalide."),
    body('rating')
        .optional()
        .isFloat({ min: 1, max: 5 }).withMessage("La note doit être entre 1 et 5."),
    body('rating_accueil')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("La note accueil doit être entre 1 et 5."),
    body('rating_proprete')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("La note propreté doit être entre 1 et 5."),
    body('rating_ambiance')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("La note ambiance doit être entre 1 et 5."),
    body('rating_qualite')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("La note qualité doit être entre 1 et 5."),
    body('comment')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage("Commentaire trop long (1000 caractères max)."),
    validate,
];

// ── Admin ─────────────────────────────────────────────────────────────────────

const validateToggleBan = [
    param('id')
        .isInt({ min: 1 }).withMessage("ID utilisateur invalide."),
    body('ban_reason')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage("Raison trop longue (500 caractères max)."),
    validate,
];

const validateUpdateProvider = [
    param('id')
        .isInt({ min: 1 }).withMessage("ID prestataire invalide."),
    body('is_certified')
        .optional()
        .isBoolean().withMessage("is_certified doit être un booléen."),
    body('is_visible')
        .optional()
        .isBoolean().withMessage("is_visible doit être un booléen."),
    body('admin_note')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage("Note trop longue (1000 caractères max)."),
    validate,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validateRefuseAppointment,
    validateCreateAppointment,
    validateAvailability,
    validateCreateReview,
    validateToggleBan,
    validateUpdateProvider,
};
