const prisma = require('../prisma/client');
const safeJson = require('../utils/safeJson');

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
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [users, providers, appointments, reviews, banned, newToday] = await Promise.all([
            prisma.user.count(),
            prisma.provider.count(),
            prisma.appointment.count(),
            prisma.review.count(),
            prisma.user.count({ where: { is_banned: true } }),
            prisma.user.count({ where: { created_at: { gte: today } } }),
        ]);
        safeJson(res, { users, providers, appointments, reviews, banned, newToday });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProviders = async (req, res) => {
    try {
        const providers = await prisma.provider.findMany({
            include: {
                user: { select: { id: true, email: true, first_name: true, last_name: true } },
                category: { select: { name: true } },
                _count: { select: { services: true, appointments: true, reviews: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        safeJson(res, providers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProvider = async (req, res) => {
    const id = Number(req.params.id);
    const { is_certified, is_visible, admin_note } = req.body;
    try {
        const updated = await prisma.provider.update({
            where: { id },
            data: {
                ...(is_certified !== undefined ? { is_certified } : {}),
                ...(is_visible   !== undefined ? { is_visible }   : {}),
                ...(admin_note   !== undefined ? { admin_note: admin_note || null } : {}),
            },
            select: { id: true, name: true, is_certified: true, is_visible: true, admin_note: true },
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getUsers, toggleBan, deleteUser, getStats, getProviders, updateProvider };
