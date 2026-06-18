const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const logger = require('../logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24h
};

const register = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email et mot de passe obligatoires." });
    if (!EMAIL_REGEX.test(email))
        return res.status(400).json({ error: "Format d'email invalide." });
    if (password.length < 8)
        return res.status(400).json({ error: "Le mot de passe doit faire au moins 8 caractères." });
    if (!/[A-Z]/.test(password))
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins une majuscule." });
    if (!/[0-9]/.test(password))
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins un chiffre." });

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const finalRole = (role === 'admin') ? 'user' : (role || 'user');

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, role: finalRole },
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        logger.info('Inscription réussie', { userId: user.id, email, role: finalRole });
        res.cookie('token', token, COOKIE_OPTS);
        res.status(201).json({ user: { id: user.id, email, role: finalRole } });
    } catch (err) {
        logger.error('Erreur inscription', { email, message: err.message });
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email et mot de passe obligatoires." });
    if (!EMAIL_REGEX.test(email))
        return res.status(400).json({ error: "Format d'email invalide." });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            logger.warn('Tentative de connexion — email inconnu', { email });
            return res.status(401).json({ error: "Identifiants invalides" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn('Tentative de connexion — mot de passe incorrect', { userId: user.id });
            return res.status(401).json({ error: "Identifiants invalides" });
        }

        if (user.is_banned) {
            logger.warn('Connexion refusée — compte banni', { userId: user.id });
            return res.status(403).json({ error: "Compte suspendu.", banned: true, ban_reason: user.ban_reason });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        logger.info('Connexion réussie', { userId: user.id, role: user.role });
        res.cookie('token', token, COOKIE_OPTS);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
            },
        });
    } catch (err) {
        logger.error('Erreur connexion', { message: err.message });
        res.status(500).json({ error: err.message });
    }
};

const logout = (req, res) => {
    logger.info('Déconnexion', { userId: req.auth?.userId });
    res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
    res.json({ message: "Déconnecté avec succès." });
};

module.exports = { register, login, logout };
