const prisma = require('../prisma/client');

const getFavorites = async (req, res) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { user_id: req.auth.userId },
            include: {
                provider: { include: { category: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        res.json(favorites.map(f => ({
            id:           f.provider.id,
            name:         f.provider.name,
            image_url:    f.provider.image_url,
            city:         f.provider.city,
            is_certified: f.provider.is_certified,
            category_name: f.provider.category?.name || null,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleFavorite = async (req, res) => {
    const providerId = Number(req.params.providerId);
    const userId = req.auth.userId;
    try {
        const existing = await prisma.favorite.findUnique({
            where: { user_id_provider_id: { user_id: userId, provider_id: providerId } },
        });
        if (existing) {
            await prisma.favorite.delete({ where: { id: existing.id } });
            res.json({ favorited: false });
        } else {
            await prisma.favorite.create({ data: { user_id: userId, provider_id: providerId } });
            res.json({ favorited: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getFavorites, toggleFavorite };