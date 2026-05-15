const prisma = require('../prisma/client');

const safeJson = (res, data) =>
    res.send(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? Number(v) : v));

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, first_name: true, last_name: true, email: true,
                role: true, is_banned: true, ban_reason: true, created_at: true,
                _count: { select: { appointments: true, reviews: true } },
                provider: { select: { id: true, name: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        safeJson(res, users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleBan = async (req, res) => {
    const { id } = req.params;
    const { ban_reason } = req.body;
    if (Number(id) === req.auth.userId) return res.status(400).json({ error: "Impossible de se bannir soi-même." });
    try {
        const user = await prisma.user.findUnique({ where: { id: Number(id) }, select: { is_banned: true } });
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

        const updated = await prisma.user.update({
            where: { id: Number(id) },
            data: { is_banned: !user.is_banned, ban_reason: !user.is_banned ? (ban_reason || null) : null },
            select: { id: true, is_banned: true, ban_reason: true },
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id) === req.auth.userId) return res.status(400).json({ error: "Impossible de supprimer son propre compte." });
    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "Compte supprimé." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getStats = async (req, res) => {
    try {
        const [users, providers, appointments, reviews] = await Promise.all([
            prisma.user.count(),
            prisma.provider.count(),
            prisma.appointment.count(),
            prisma.review.count(),
        ]);
        const banned = await prisma.user.count({ where: { is_banned: true } });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const newToday = await prisma.user.count({ where: { created_at: { gte: today } } });
        safeJson(res, { users, providers, appointments, reviews, banned, newToday });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getUsers, toggleBan, deleteUser, getStats };
