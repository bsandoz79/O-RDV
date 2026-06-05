const prisma = require('../prisma/client');
const { cacheGet, cacheSet, cacheDel } = require('../redis');

async function geocodeAddress(address, zipCode, city) {
    if (!address && !city) return { latitude: null, longitude: null };

    // Essai 1 : adresse complète structurée (plus précise)
    if (address && city) {
        try {
            const params = new URLSearchParams({
                street: address,
                city: city,
                ...(zipCode ? { postalcode: zipCode } : {}),
                country: 'France',
                format: 'json',
                limit: '1',
                addressdetails: '1',
            });
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                { headers: { 'User-Agent': 'ORDV-App/1.0' } }
            );
            const data = await res.json();
            if (data.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        } catch {}
    }

    // Essai 2 : requête libre avec code pays
    try {
        const query = [address, zipCode, city, 'France'].filter(Boolean).join(', ');
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=fr`,
            { headers: { 'User-Agent': 'ORDV-App/1.0' } }
        );
        const data = await res.json();
        if (data.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    } catch {}

    return { latitude: null, longitude: null };
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

        // Clé de cache sans lat/lng (données stables) — TTL 5 min
        const cacheKey = `shop:providers:${category_id || ''}:${city || ''}`;
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        const cached = await cacheGet(cacheKey);
        if (cached) {
            let result = JSON.parse(cached);
            // Recalcule la distance et re-trie si l'utilisateur a une position GPS
            if (userLat && userLng) {
                const calcDistance = (pLat, pLng) => {
                    if (!pLat || !pLng) return null;
                    const R = 6371;
                    const dLat = (pLat - userLat) * Math.PI / 180;
                    const dLng = (pLng - userLng) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(pLat*Math.PI/180) * Math.sin(dLng/2)**2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                };
                result = result
                    .map(p => ({ ...p, distance_km: p.latitude && p.longitude ? Math.round(calcDistance(p.latitude, p.longitude) * 10) / 10 : null }))
                    .sort((a, b) => {
                        if (a.distance_km === null) return 1;
                        if (b.distance_km === null) return -1;
                        return a.distance_km - b.distance_km;
                    });
            }
            return res.type('json').send(JSON.stringify(result, (_, v) => typeof v === 'bigint' ? Number(v) : v));
        }

        const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(new Date()).toLowerCase();

        const providers = await prisma.provider.findMany({
            where: {
                is_visible: true,
                ...(category_id ? { category_id: Number(category_id) } : {}),
                ...(city ? { city: { contains: city } } : {}),
            },
            include: {
                category: true,
                businessHours: { where: { day_of_week: todayName } },
                photos: { orderBy: [{ is_main: 'desc' }, { display_order: 'asc' }, { created_at: 'asc' }] },
            },
        });

        const calcDistance = (pLat, pLng) => {
            if (!userLat || !userLng || !pLat || !pLng) return null;
            const R = 6371;
            const dLat = (pLat - userLat) * Math.PI / 180;
            const dLng = (pLng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(pLat*Math.PI/180) * Math.sin(dLng/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        // Moyenne des avis par prestataire
        const ratings = await prisma.$queryRaw`
            SELECT provider_id, ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS review_count
            FROM reviews GROUP BY provider_id`;
        const ratingMap = Object.fromEntries(ratings.map(r => [r.provider_id, r]));

        let result = providers.map(p => {
            const bh = p.businessHours[0];
            const distance = calcDistance(p.latitude, p.longitude);
            const rev = ratingMap[p.id];
            return {
                ...p,
                category_name: p.category?.name || null,
                category_icon: p.category?.icon || null,
                today_is_closed: bh?.is_closed ?? null,
                today_open: fmtTime(bh?.open_time),
                today_close: fmtTime(bh?.close_time),
                distance_km: distance !== null ? Math.round(distance * 10) / 10 : null,
                avg_rating: rev ? Number(rev.avg_rating) : null,
                review_count: rev ? Number(rev.review_count) : 0,
                is_certified: p.is_certified,
                photos: (p.photos || []).map(ph => ({ id: ph.id, photo_url: ph.photo_url, is_main: ph.is_main })),
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

        // Mise en cache sans la distance (propre à chaque utilisateur)
        const toCache = result.map(p => ({ ...p, distance_km: null }));
        await cacheSet(cacheKey, JSON.stringify(toCache, (_, v) => typeof v === 'bigint' ? Number(v) : v), 300);

        const safe = JSON.stringify(result, (_, v) => typeof v === 'bigint' ? Number(v) : v);
        res.type('json').send(safe);
    } catch {
        res.status(500).json({ error: "Erreur lors de la récupération des prestataires" });
    }
};

const getProviderProfile = async (req, res) => {
    try {
        const provider = await prisma.provider.findUnique({
            where: { id: Number(req.params.providerId) },
            include: {
                services: true,
                businessHours: true,
                photos: { orderBy: [{ is_main: 'desc' }, { display_order: 'asc' }, { created_at: 'asc' }] },
            },
        });
        if (!provider) return res.status(404).json({ error: "Prestataire introuvable" });
        const { businessHours, ...rest } = provider;
        const hours = businessHours.map(h => ({ ...h, open_time: fmtTime(h.open_time), close_time: fmtTime(h.close_time) }));

        // group_name / group_description hors schema Prisma → raw query
        let services = rest.services;
        try {
            const groups = await prisma.$queryRaw`SELECT id, group_name, group_description FROM services WHERE provider_id = ${provider.id}`;
            const gMap = new Map(groups.map(g => [Number(g.id), { group_name: g.group_name, group_description: g.group_description }]));
            services = services.map(s => ({ ...s, ...( gMap.get(s.id) || {}) }));
        } catch { /* colonne pas encore créée, on ignore */ }

        res.json({ ...rest, services, hours });
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

        // group_name / group_description hors schema Prisma → raw query
        let services = rest.services;
        try {
            const groups = await prisma.$queryRaw`SELECT id, group_name, group_description FROM services WHERE provider_id = ${provider.id}`;
            const gMap = new Map(groups.map(g => [Number(g.id), { group_name: g.group_name, group_description: g.group_description }]));
            services = services.map(s => ({ ...s, ...(gMap.get(s.id) || {}) }));
        } catch { /* colonne pas encore créée, on ignore */ }

        res.json({ ...rest, services, hours });
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

        // Coordonnées manuelles (ajustées par le pro sur la carte) prioritaires sur le géocodage auto
        let latitude, longitude;
        if (profile.manualLat != null && profile.manualLng != null) {
            latitude  = parseFloat(profile.manualLat);
            longitude = parseFloat(profile.manualLng);
        } else {
            ({ latitude, longitude } = await geocodeAddress(profile.address, profile.zipCode, profile.city));
        }

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
                access_info:  profile.accessInfo  || null,
                payment_info: profile.paymentInfo || null,
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
                access_info:  profile.accessInfo  || null,
                payment_info: profile.paymentInfo || null,
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
                    data: { price: parseFloat(s.price), duration: parseInt(s.duration) || 30 },
                });
                try { await prisma.$executeRaw`UPDATE services SET group_name = ${s.group_name || null}, group_description = ${s.group_description || null} WHERE id = ${match.id}`; } catch {}
            } else {
                const created = await prisma.service.create({
                    data: { provider_id: provider.id, label: s.label, price: parseFloat(s.price), duration: parseInt(s.duration) || 30 },
                });
                try { await prisma.$executeRaw`UPDATE services SET group_name = ${s.group_name || null}, group_description = ${s.group_description || null} WHERE id = ${created.id}`; } catch {}
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

        // Invalide le cache prestataires (les données ont changé)
        await cacheDel('shop:providers:*');

        res.status(200).json({ message: "Configuration enregistrée avec succès !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProviderPhotos = async (req, res) => {
    try {
        const photos = await prisma.providerPhoto.findMany({
            where: { provider_id: Number(req.params.providerId) },
            orderBy: [{ is_main: 'desc' }, { display_order: 'asc' }, { created_at: 'asc' }],
        });
        res.json(photos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addProviderPhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé.' });
        const provider = await prisma.provider.findFirst({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });

        const count = await prisma.providerPhoto.count({ where: { provider_id: provider.id } });
        if (count >= 10) return res.status(400).json({ error: 'Maximum 10 photos atteint.' });

        const isFirst = count === 0;
        const photo = await prisma.providerPhoto.create({
            data: {
                provider_id: provider.id,
                photo_url: req.file.path,
                is_main: isFirst,
                display_order: count,
            },
        });
        if (isFirst) {
            await prisma.provider.update({ where: { id: provider.id }, data: { image_url: req.file.path } });
            await cacheDel('shop:providers:*');
        }
        res.status(201).json(photo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteProviderPhoto = async (req, res) => {
    try {
        const provider = await prisma.provider.findFirst({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });

        const photo = await prisma.providerPhoto.findFirst({
            where: { id: Number(req.params.photoId), provider_id: provider.id },
        });
        if (!photo) return res.status(404).json({ error: 'Photo introuvable' });

        await prisma.providerPhoto.delete({ where: { id: photo.id } });

        if (photo.is_main) {
            const next = await prisma.providerPhoto.findFirst({
                where: { provider_id: provider.id },
                orderBy: { created_at: 'asc' },
            });
            if (next) await prisma.providerPhoto.update({ where: { id: next.id }, data: { is_main: true } });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const setMainPhoto = async (req, res) => {
    try {
        const provider = await prisma.provider.findFirst({ where: { user_id: req.auth.userId } });
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });

        const photo = await prisma.providerPhoto.findFirst({
            where: { id: Number(req.params.photoId), provider_id: provider.id },
        });
        if (!photo) return res.status(404).json({ error: 'Photo introuvable' });

        await prisma.providerPhoto.updateMany({ where: { provider_id: provider.id }, data: { is_main: false } });
        await prisma.providerPhoto.update({ where: { id: photo.id }, data: { is_main: true } });
        // La photo principale devient l'image affichée sur les cartes prestataires
        await prisma.provider.update({ where: { id: provider.id }, data: { image_url: photo.photo_url } });
        await cacheDel('shop:providers:*');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCategories, getAllProviders, getProviderProfile, getShopInfo, setupShop, getProviderPhotos, addProviderPhoto, deleteProviderPhoto, setMainPhoto };
