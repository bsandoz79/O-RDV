const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const multer = require('multer');
const path = require('path');
const prisma = require('../prisma/client');

// Prisma retourne les colonnes TIME MySQL sous forme de Date — on extrait HH:MM
function fmtTime(t) {
    if (!t) return null;
    if (typeof t === 'string') return t.substring(0, 5);
    const d = new Date(t);
    return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// GET /api/shop/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        res.json(categories);
    } catch {
        res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
    }
});

// GET /api/shop/all
router.get('/all', async (req, res) => {
    try {
        const { category_id, city } = req.query;
        const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(new Date()).toLowerCase();

        const providers = await prisma.provider.findMany({
            where: {
                ...(category_id ? { category_id: Number(category_id) } : {}),
                ...(city ? { city: { contains: city } } : {}),
            },
            include: {
                category: true,
                businessHours: { where: { day_of_week: todayName } },
            },
        });

        const result = providers.map(p => {
            const bh = p.businessHours[0];
            return {
                ...p,
                category_name: p.category?.name || null,
                category_icon: p.category?.icon || null,
                today_is_closed: bh?.is_closed ?? null,
                today_open: fmtTime(bh?.open_time),
                today_close: fmtTime(bh?.close_time),
                businessHours: undefined,
                category: undefined,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des prestataires" });
    }
});

// GET /api/shop/profile/:providerId
router.get('/profile/:providerId', async (req, res) => {
    try {
        const provider = await prisma.provider.findUnique({
            where: { id: Number(req.params.providerId) },
            include: { services: true, businessHours: true },
        });
        if (!provider) return res.status(404).json({ error: "Prestataire introuvable" });
        const { businessHours, ...rest } = provider;
        const hours = businessHours.map(h => ({ ...h, open_time: fmtTime(h.open_time), close_time: fmtTime(h.close_time) }));
        res.json({ ...rest, hours });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/shop/info/:userId
router.get('/info/:userId', auth, async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (req.auth.role !== 'admin' && req.auth.userId !== userId)
            return res.status(403).json({ error: "Accès non autorisé" });

        const provider = await prisma.provider.findUnique({
            where: { user_id: userId },
            include: { services: true, businessHours: true },
        });
        if (!provider) return res.status(404).json({ error: "Profil non trouvé" });
        const { businessHours, ...rest } = provider;
        const hours = businessHours.map(h => ({ ...h, open_time: fmtTime(h.open_time), close_time: fmtTime(h.close_time) }));
        res.json({ ...rest, hours });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/shop/setup
router.post('/setup', auth, checkRole(['pro', 'admin']), upload.single('image'), async (req, res) => {
    try {
        const userId = req.auth.userId;
        const profile = JSON.parse(req.body.profile);
        const hours = JSON.parse(req.body.hours);
        const services = req.body.services ? JSON.parse(req.body.services) : [];
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const provider = await prisma.provider.upsert({
            where: { user_id: userId },
            update: {
                category_id: profile.categoryId ? Number(profile.categoryId) : null,
                name: profile.name,
                description: profile.description,
                address: profile.address,
                zip_code: profile.zipCode,
                city: profile.city,
                phone: profile.phone,
                ...(imageUrl ? { image_url: imageUrl } : {}),
            },
            create: {
                user_id: userId,
                category_id: profile.categoryId ? Number(profile.categoryId) : null,
                name: profile.name,
                description: profile.description,
                address: profile.address,
                zip_code: profile.zipCode,
                city: profile.city,
                phone: profile.phone,
                image_url: imageUrl,
            },
        });

        // Remplace les services
        await prisma.service.deleteMany({ where: { provider_id: provider.id } });
        const validServices = services.filter(s => s.label && s.price);
        if (validServices.length > 0) {
            await prisma.service.createMany({
                data: validServices.map(s => ({
                    provider_id: provider.id,
                    label: s.label,
                    price: parseFloat(s.price),
                    duration: s.duration || 30,
                })),
            });
        }

        // Remplace les horaires
        await prisma.businessHour.deleteMany({ where: { provider_id: provider.id } });
        await prisma.businessHour.createMany({
            data: hours.map(h => ({
                provider_id: provider.id,
                day_of_week: h.day_of_week,
                open_time: h.open || '09:00',
                close_time: h.close || '18:00',
                is_closed: h.closed ? true : false,
            })),
        });

        res.status(200).json({ message: "Configuration enregistrée avec succès !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
