const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../prisma/client', () => ({
    user: { findUnique: jest.fn() },
    favorite: {
        findMany:   jest.fn(),
        findUnique: jest.fn(),
        create:     jest.fn(),
        delete:     jest.fn(),
    },
}));

const prisma = require('../prisma/client');
const favoritesRoutes = require('../routes/favorites');

const SECRET = 'test_secret';
process.env.JWT_SECRET = SECRET;

const app = express();
app.use(express.json());
app.use('/api/favorites', favoritesRoutes);

function makeToken(id = 10, role = 'user') {
    return jwt.sign({ id, role }, SECRET);
}

beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ is_banned: false });
});

// ── GET /api/favorites ───────────────────────────────────────────────────────

describe('GET /api/favorites', () => {
    test('retourne 401 sans token', async () => {
        const res = await request(app).get('/api/favorites');
        expect(res.status).toBe(401);
    });

    test('retourne la liste des favoris', async () => {
        prisma.favorite.findMany.mockResolvedValueOnce([
            {
                provider: {
                    id: 1, name: 'Salon A', image_url: null,
                    city: 'Amiens', is_certified: false,
                    category: { name: 'Coiffure' },
                },
            },
        ]);

        const res = await request(app)
            .get('/api/favorites')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toHaveProperty('name', 'Salon A');
        expect(res.body[0]).toHaveProperty('category_name', 'Coiffure');
    });

    test('retourne un tableau vide si aucun favori', async () => {
        prisma.favorite.findMany.mockResolvedValueOnce([]);

        const res = await request(app)
            .get('/api/favorites')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });
});

// ── POST /api/favorites/:providerId ─────────────────────────────────────────

describe('POST /api/favorites/:providerId', () => {
    test('retourne 401 sans token', async () => {
        const res = await request(app).post('/api/favorites/5');
        expect(res.status).toBe(401);
    });

    test('ajoute aux favoris si non existant', async () => {
        prisma.favorite.findUnique.mockResolvedValueOnce(null);
        prisma.favorite.create.mockResolvedValueOnce({ id: 99 });

        const res = await request(app)
            .post('/api/favorites/5')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ favorited: true });
    });

    test('supprime des favoris si déjà existant', async () => {
        prisma.favorite.findUnique.mockResolvedValueOnce({ id: 42 });
        prisma.favorite.delete.mockResolvedValueOnce({ id: 42 });

        const res = await request(app)
            .post('/api/favorites/5')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ favorited: false });
    });
});
