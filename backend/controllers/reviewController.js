const prisma = require('../prisma/client');
const safeJson = require('../utils/safeJson');

const createReview = async (req, res) => {
    const { appointment_id, rating, comment } = req.body;
    const client_id = req.auth.userId;

    if (!appointment_id || !rating) return res.status(400).json({ error: "appointment_id et rating sont obligatoires." });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "La note doit être entre 1 et 5." });

    try {
        const appt = await prisma.appointment.findUnique({ where: { id: Number(appointment_id) } });
        if (!appt) return res.status(404).json({ error: "Rendez-vous introuvable." });
        if (appt.client_id !== client_id) return res.status(403).json({ error: "Accès refusé." });
        if (appt.status !== 'completed') return res.status(400).json({ error: "Vous ne pouvez noter qu'un rendez-vous terminé." });

        const review = await prisma.review.create({
            data: {
                client_id,
                provider_id: appt.provider_id,
                appointment_id: Number(appointment_id),
                rating: Number(rating),
                comment: comment?.trim() || null,
            },
        });

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
            SELECT ROUND(AVG(rating), 1) AS avg FROM reviews WHERE provider_id = ${providerId}`;

        const formatted = reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            client: r.client,
            like_count: r.likes.length,
            liked_by_me: currentUserId ? r.likes.some(l => l.user_id === currentUserId) : false,
        }));

        safeJson(res, { reviews: formatted, average: avgResult?.avg ? Number(avgResult.avg) : null, count: reviews.length });
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
