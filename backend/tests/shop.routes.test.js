const request = require('supertest');
const express = require('express');

jest.mock('../prisma/client', () => ({
    user: { findUnique: jest.fn() },
    category: { findMany: jest.fn() },
    provider: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
}));

jest.mock('../middlewares/upload', () => ({
    uploadShopImage:   { single: jest.fn(() => (req, res, next) => next()) },
    uploadServiceImage:{ single: jest.fn(() => (req, res, next) => next()) },
}));

const prisma = require('../prisma/client');
const shopRoutes = require('../routes/shop');

process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(express.json());
app.use('/api/shop', shopRoutes);

beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ is_banned: false });
});

// ── GET /api/shop/categories ─────────────────────────────────────────────────

describe('GET /api/shop/categories', () => {
    test('retourne la liste des catégories', async () => {
        prisma.category.findMany.mockResolvedValueOnce([
            { id: 1, name: 'Coiffure',   icon: '✂️' },
            { id: 2, name: 'Esthétique', icon: '💄' },
        ]);

        const res = await request(app).get('/api/shop/categories');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('name', 'Coiffure');
    });

    test('retourne 500 en cas d\'erreur base de données', async () => {
        prisma.category.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/shop/categories');

        expect(res.status).toBe(500);
    });
});

// ── GET /api/shop/all ────────────────────────────────────────────────────────

describe('GET /api/shop/all', () => {
    test('retourne la liste des prestataires', async () => {
        prisma.provider.findMany.mockResolvedValueOnce([
            {
                id: 1, name: 'Salon Élégance', is_visible: true,
                latitude: 49.9, longitude: 2.3,
                category: { name: 'Coiffure', icon: '✂️' },
                businessHours: [],
            },
        ]);
        prisma.$queryRaw.mockResolvedValueOnce([]);

        const res = await request(app).get('/api/shop/all');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('name', 'Salon Élégance');
    });

    test('retourne un tableau vide si aucun prestataire', async () => {
        prisma.provider.findMany.mockResolvedValueOnce([]);
        prisma.$queryRaw.mockResolvedValueOnce([]);

        const res = await request(app).get('/api/shop/all');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    test('trie par distance si lat/lng fournis', async () => {
        prisma.provider.findMany.mockResolvedValueOnce([
            { id: 2, name: 'Loin',   is_visible: true, latitude: 48.0, longitude: 2.0, category: null, businessHours: [] },
            { id: 1, name: 'Proche', is_visible: true, latitude: 49.9, longitude: 2.3, category: null, businessHours: [] },
        ]);
        prisma.$queryRaw.mockResolvedValueOnce([]);

        const res = await request(app).get('/api/shop/all?lat=49.9&lng=2.3');

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('name', 'Proche');
    });

    test('retourne la note moyenne si disponible', async () => {
        prisma.provider.findMany.mockResolvedValueOnce([
            {
                id: 1, name: 'Top Salon', is_visible: true,
                latitude: null, longitude: null,
                category: null, businessHours: [],
            },
        ]);
        prisma.$queryRaw.mockResolvedValueOnce([
            { provider_id: 1, avg_rating: 4.5, review_count: 12 },
        ]);

        const res = await request(app).get('/api/shop/all');

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('avg_rating', 4.5);
        expect(res.body[0]).toHaveProperty('review_count', 12);
    });
});
