const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

module.exports = async (req, res, next) => {
    try {
        // Cookie httpOnly en priorité, Authorization header en fallback (impersonation admin)
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { is_banned: true, ban_reason: true },
        });

        if (user?.is_banned) {
            return res.status(403).json({
                error: "Compte suspendu.",
                banned: true,
                ban_reason: user.ban_reason || null,
            });
        }

        req.auth = { userId: decoded.id, role: decoded.role };
        next();
    } catch {
        res.status(401).json({ error: "Requête non authentifiée !" });
    }
};
