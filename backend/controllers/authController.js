const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email et mot de passe obligatoires." });
    if (!EMAIL_REGEX.test(email))
        return res.status(400).json({ error: "Format d'email invalide." });
    if (password.length < 6)
        return res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères." });

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

        res.status(201).json({ token, user: { id: user.id, email, role: finalRole } });
    } catch (err) {
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
        if (!user) return res.status(401).json({ error: "Identifiants invalides" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Identifiants invalides" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
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
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login };
