const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../prisma/client', () => ({
    user:        { findUnique: jest.fn() },
    appointment: { findUnique: jest.fn() },
    review:      { create: jest.fn(), findMany: jest.fn() },
    reviewLike:  { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    $queryRaw:   jest.fn(),
}));

jest.mock('../utils/safeJson', () => (res, data) => res.json(data));

const prisma = require('../prisma/client');
const reviewsRoutes = require('../routes/reviews');

const SECRET = 'test_secret';
process.env.JWT_SECRET = SECRET;

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewsRoutes);

function makeToken(id = 10, role = 'user') {
    return jwt.sign({ id, role }, SECRET);
}

beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ is_banned: false });
});

// ── POST /api/reviews ────────────────────────────────────────────────────────

describe('POST /api/reviews', () => {
    test('retourne 401 sans token', async () => {
        const res = await request(app).post('/api/reviews').send({});
        expect(res.status).toBe(401);
    });

    test('retourne 400 si champs manquants', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/obligatoires/i);
    });

    test('retourne 400 si note hors plage (> 5)', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ appointment_id: 1, rating: 6 });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/entre 1 et 5/i);
    });

    test('retourne 404 si rendez-vous introuvable', async () => {
        prisma.appointment.findUnique.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken(10)}`)
            .send({ appointment_id: 999, rating: 4 });

        expect(res.status).toBe(404);
    });

    test("retourne 403 si le rendez-vous n'appartient pas à l'utilisateur", async () => {
        prisma.appointment.findUnique.mockResolvedValueOnce({
            id: 1, client_id: 99, status: 'completed',
        });

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken(10)}`)
            .send({ appointment_id: 1, rating: 4 });

        expect(res.status).toBe(403);
    });

    test("retourne 400 si le rendez-vous n'est pas terminé", async () => {
        prisma.appointment.findUnique.mockResolvedValueOnce({
            id: 1, client_id: 10, status: 'pending',
        });

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken(10)}`)
            .send({ appointment_id: 1, rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/terminé/i);
    });

    test('retourne 201 pour un avis valide', async () => {
        prisma.appointment.findUnique.mockResolvedValueOnce({
            id: 1, client_id: 10, provider_id: 5, status: 'completed',
        });
        prisma.review.create.mockResolvedValueOnce({ id: 1, rating: 5, comment: 'Super!' });

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${makeToken(10)}`)
            .send({ appointment_id: 1, rating: 5, comment: 'Super!' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('rating', 5);
    });
});

// ── GET /api/reviews/provider/:providerId ────────────────────────────────────

describe('GET /api/reviews/provider/:providerId', () => {
    test("retourne les avis d'un prestataire", async () => {
        prisma.review.findMany.mockResolvedValueOnce([
            {
                id: 1, rating: 4, comment: 'Très bien', created_at: new Date(),
                client: { first_name: 'Alice', last_name: 'M', profile_picture: null },
                likes: [],
            },
        ]);
        prisma.$queryRaw.mockResolvedValueOnce([{ avg: 4.0 }]);

        const res = await request(app).get('/api/reviews/provider/5');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('reviews');
        expect(res.body.reviews).toHaveLength(1);
        expect(res.body).toHaveProperty('count', 1);
    });

    test('retourne average null si aucun avis', async () => {
        prisma.review.findMany.mockResolvedValueOnce([]);
        prisma.$queryRaw.mockResolvedValueOnce([{ avg: null }]);

        const res = await request(app).get('/api/reviews/provider/5');

        expect(res.status).toBe(200);
        expect(res.body.average).toBeNull();
        expect(res.body.count).toBe(0);
    });
});

// ── POST /api/reviews/:id/like ───────────────────────────────────────────────

describe('POST /api/reviews/:id/like', () => {
    test('retourne 401 sans token', async () => {
        const res = await request(app).post('/api/reviews/1/like');
        expect(res.status).toBe(401);
    });

    test('ajoute un like si non existant', async () => {
        prisma.reviewLike.findUnique.mockResolvedValueOnce(null);
        prisma.reviewLike.create.mockResolvedValueOnce({ id: 1 });

        const res = await request(app)
            .post('/api/reviews/1/like')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ liked: true });
    });

    test('supprime le like si déjà existant', async () => {
        prisma.reviewLike.findUnique.mockResolvedValueOnce({ id: 7 });
        prisma.reviewLike.delete.mockResolvedValueOnce({ id: 7 });

        const res = await request(app)
            .post('/api/reviews/1/like')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ liked: false });
    });
});
