const prisma = require('../prisma/client');
const safeJson = require('../utils/safeJson');
const { cacheDel } = require('../redis');

const createReview = async (req, res) => {
    const { appointment_id, rating, comment, rating_accueil, rating_proprete, rating_ambiance, rating_qualite } = req.body;
    const client_id = req.auth.userId;

    if (!appointment_id) return res.status(400).json({ error: "appointment_id est obligatoire." });

    try {
        const appt = await prisma.appointment.findUnique({ where: { id: Number(appointment_id) } });
        if (!appt) return res.status(404).json({ error: "Rendez-vous introuvable." });
        if (appt.client_id !== client_id) return res.status(403).json({ error: "Accès refusé." });
        if (appt.status !== 'completed') return res.status(400).json({ error: "Vous ne pouvez noter qu'un rendez-vous terminé." });

        const toInt = v => (v && Number(v) >= 1 && Number(v) <= 5) ? Number(v) : null;
        const a = toInt(rating_accueil), p = toInt(rating_proprete), b = toInt(rating_ambiance), q = toInt(rating_qualite);

        // Note globale = moyenne des sous-notes si toutes fournies, sinon note explicite, sinon erreur
        const subVals = [a, p, b, q].filter(v => v !== null);
        let globalRating;
        if (subVals.length === 4) {
            globalRating = Math.round(subVals.reduce((s, v) => s + v, 0) / 4 * 10) / 10;
        } else if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
            globalRating = Number(rating);
        } else {
            return res.status(400).json({ error: "Notez les 4 catégories ou fournissez une note globale." });
        }

        const review = await prisma.review.create({
            data: {
                client_id,
                provider_id: appt.provider_id,
                appointment_id: Number(appointment_id),
                rating: globalRating,
                rating_accueil:  a,
                rating_proprete: p,
                rating_ambiance: b,
                rating_qualite:  q,
                comment: comment?.trim() || null,
            },
        });

        // Invalide le cache providers (les notes moyennes ont changé)
        try { await cacheDel('shop:providers:*'); } catch {}

        res.status(201).json(review);
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ error: "Vous avez déjà noté ce rendez-vous." });
        res.status(500).json({ error: err.message });
    }
};

const getProviderReviews = async (req, res) => {
    try {
        const providerId = Number(req.params.providerId);
        const currentUserId = req.auth?.userId ?? null;

        const reviews = await prisma.review.findMany({
            where: { provider_id: providerId },
            include: {
                client: { select: { first_name: true, last_name: true, profile_picture: true } },
                likes: { select: { user_id: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        const [avgResult] = await prisma.$queryRaw`
            SELECT
                ROUND(AVG(rating), 1)           AS avg,
                ROUND(AVG(rating_accueil), 1)   AS avg_accueil,
                ROUND(AVG(rating_proprete), 1)  AS avg_proprete,
                ROUND(AVG(rating_ambiance), 1)  AS avg_ambiance,
                ROUND(AVG(rating_qualite), 1)   AS avg_qualite
            FROM reviews WHERE provider_id = ${providerId}`;

        const formatted = reviews.map(r => ({
            id:              r.id,
            rating:          r.rating,
            rating_accueil:  r.rating_accueil,
            rating_proprete: r.rating_proprete,
            rating_ambiance: r.rating_ambiance,
            rating_qualite:  r.rating_qualite,
            comment:         r.comment,
            created_at:      r.created_at,
            client:          r.client,
            like_count:      r.likes.length,
            liked_by_me:     currentUserId ? r.likes.some(l => l.user_id === currentUserId) : false,
        }));

        safeJson(res, {
            reviews,
            average:      avgResult?.avg          ? Number(avgResult.avg)          : null,
            avg_accueil:  avgResult?.avg_accueil  ? Number(avgResult.avg_accueil)  : null,
            avg_proprete: avgResult?.avg_proprete ? Number(avgResult.avg_proprete) : null,
            avg_ambiance: avgResult?.avg_ambiance ? Number(avgResult.avg_ambiance) : null,
            avg_qualite:  avgResult?.avg_qualite  ? Number(avgResult.avg_qualite)  : null,
            count:        reviews.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleLike = async (req, res) => {
    const userId = req.auth.userId;
    const reviewId = Number(req.params.id);
    try {
        const existing = await prisma.reviewLike.findUnique({
            where: { review_id_user_id: { review_id: reviewId, user_id: userId } },
        });
        if (existing) {
            await prisma.reviewLike.delete({ where: { id: existing.id } });
            res.json({ liked: false });
        } else {
            await prisma.reviewLike.create({ data: { review_id: reviewId, user_id: userId } });
            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createReview, getProviderReviews, toggleLike };
