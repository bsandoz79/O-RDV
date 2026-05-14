const prisma = require('../prisma/client');

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

        const [reviews, avgResult] = await Promise.all([
            prisma.review.findMany({
                where: { provider_id: providerId },
                include: { client: { select: { first_name: true, last_name: true, profile_picture: true } } },
                orderBy: { created_at: 'desc' },
            }),
            prisma.$queryRaw`SELECT ROUND(AVG(rating), 1) AS avg FROM reviews WHERE provider_id = ${providerId}`,
        ]);

        const average = avgResult[0]?.avg ? Number(avgResult[0].avg) : null;
        res.send(JSON.stringify({ reviews, average, count: reviews.length }, (_, v) => typeof v === 'bigint' ? Number(v) : v));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createReview, getProviderReviews };
