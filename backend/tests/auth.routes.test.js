const request = require('supertest');
const express = require('express');

// Mock DB avant tout require des routes
jest.mock('../db', () => ({
    execute: jest.fn(),
}));

const db = require('../db');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
});

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    test('retourne 400 si email déjà utilisé', async () => {
        db.execute.mockResolvedValueOnce([[{ id: 1 }]]); // email existe

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: 'pass123', role: 'user' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/déjà/i);
    });

    test('retourne 201 et un token pour un nouvel utilisateur', async () => {
        db.execute
            .mockResolvedValueOnce([[]])            // email libre
            .mockResolvedValueOnce([{ insertId: 5 }]); // INSERT

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'nouveau@test.com', password: 'pass123', role: 'user' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toMatchObject({ email: 'nouveau@test.com', role: 'user' });
    });

    test("force le rôle 'user' si on envoie 'admin'", async () => {
        db.execute
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{ insertId: 6 }]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'hacker@test.com', password: 'pass', role: 'admin' });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe('user');
    });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    test('retourne 401 si email inconnu', async () => {
        db.execute.mockResolvedValueOnce([[]]); // aucun utilisateur

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'inconnu@test.com', password: 'pass' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/invalides/i);
    });

    test('retourne 401 si mot de passe incorrect', async () => {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('correct_password', 10);
        db.execute.mockResolvedValueOnce([[{ id: 1, email: 'x@x.com', password: hash, role: 'user' }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'x@x.com', password: 'mauvais' });

        expect(res.status).toBe(401);
    });

    test('retourne 200 et un token si identifiants corrects', async () => {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('secret', 10);
        db.execute.mockResolvedValueOnce([[{
            id: 2, email: 'user@test.com', password: hash, role: 'pro',
            first_name: 'Alice', last_name: 'Martin', phone: null,
        }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: 'secret' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.role).toBe('pro');
    });
});
