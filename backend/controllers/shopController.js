const prisma = require('../prisma/client');

async function geocodeAddress(address, zipCode, city) {
    if (!address && !city) return { latitude: null, longitude: null };
    const query = [address, zipCode, city].filter(Boolean).join(', ');
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'ORDV-App/1.0' } }
        );
        const data = await res.json();
        if (data.length === 0) return { latitude: null, longitude: null };
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    } catch {
        return { latitude: null, longitude: null };
    }
}

function fmtTime(t) {
    if (!t) return null;
    if (typeof t === 'string') return t.substring(0, 5);
    const d = new Date(t);
    return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

function toDateTime(t) {
    const [hh, mm] = (t || '00:00').split(':').map(Number);
    const d = new Date(0);
    d.setUTCHours(hh, mm, 0, 0);
    return d;
}

const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        res.json(categories);
    } catch {
        res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
    }
};

const getAllProviders = async (req, res) => {
    try {
        const { category_id, city, lat, lng } = req.query;
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

        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        const calcDistance = (pLat, pLng) => {
            if (!userLat || !userLng || !pLat || !pLng) return null;
            const R = 6371;
            const dLat = (pLat - userLat) * Math.PI / 180;
            const dLng = (pLng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(pLat*Math.PI/180) * Math.sin(dLng/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        let result = providers.map(p => {
            const bh = p.businessHours[0];
            const distance = calcDistance(p.latitude, p.longitude);
            return {
                ...p,
                category_name: p.category?.name || null,
                category_icon: p.category?.icon || null,
                today_is_closed: bh?.is_closed ?? null,
                today_open: fmtTime(bh?.open_time),
                today_close: fmtTime(bh?.close_time),
                distance_km: distance !== null ? Math.round(distance * 10) / 10 : null,
                businessHours: undefined,
                category: undefined,
            };
        });

        if (userLat && userLng) {
            result.sort((a, b) => {
                if (a.distance_km === null) return 1;
                if (b.distance_km === null) return -1;
                return a.distance_km - b.distance_km;
            });
        }

        res.json(result);
    } catch {
        res.status(500).json({ error: "Erreur lors de la récupération des prestataires" });
    }
};

const getProviderProfile = async (req, res) => {
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
};

const getShopInfo = async (req, res) => {
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
};

const setupShop = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const profile = JSON.parse(req.body.profile);
        const hours = JSON.parse(req.body.hours);
        const services = req.body.services ? JSON.parse(req.body.services) : [];
        const imageUrl = req.file ? req.file.path : null;

        const { latitude, longitude } = await geocodeAddress(profile.address, profile.zipCode, profile.city);

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
                latitude,
                longitude,
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
                latitude,
                longitude,
            },
        });

        const validServices = services.filter(s => s.label && s.price);
        const existingServices = await prisma.service.findMany({ where: { provider_id: provider.id } });

        // Supprimer les services retirés, sauf ceux avec des RDV encore actifs
        const labelsNew = validServices.map(s => s.label);
        for (const existing of existingServices) {
            if (!labelsNew.includes(existing.label)) {
                const activeCount = await prisma.appointment.count({
                    where: { service_id: existing.id, status: { in: ['pending', 'confirmed'] } }
                });
                if (activeCount === 0) {
                    await prisma.service.delete({ where: { id: existing.id } });
                }
            }
        }

        // Mettre à jour ou créer chaque service
        for (const s of validServices) {
            const match = existingServices.find(e => e.label === s.label);
            if (match) {
                await prisma.service.update({
                    where: { id: match.id },
                    data: { price: parseFloat(s.price), duration: parseInt(s.duration) || 30, ...(s.image_url !== undefined ? { image_url: s.image_url || null } : {}) },
                });
            } else {
                await prisma.service.create({
                    data: { provider_id: provider.id, label: s.label, price: parseFloat(s.price), duration: parseInt(s.duration) || 30, image_url: s.image_url || null },
                });
            }
        }

        await prisma.businessHour.deleteMany({ where: { provider_id: provider.id } });
        await prisma.businessHour.createMany({
            data: hours.map(h => ({
                provider_id: provider.id,
                day_of_week: h.day_of_week,
                open_time: toDateTime(h.open || '09:00'),
                close_time: toDateTime(h.close || '18:00'),
                is_closed: h.closed ? true : false,
            })),
        });

        res.status(200).json({ message: "Configuration enregistrée avec succès !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCategories, getAllProviders, getProviderProfile, getShopInfo, setupShop };
