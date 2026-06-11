const request = require('supertest');
const express = require('express');

jest.mock('../prisma/client', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
}));

const prisma = require('../prisma/client');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test_secret';
});

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    test('retourne 400 si email déjà utilisé', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: 'Password1', role: 'user' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/déjà/i);
    });

    test('retourne 201 et un cookie pour un nouvel utilisateur', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null);
        prisma.user.create.mockResolvedValueOnce({ id: 5, email: 'nouveau@test.com', role: 'user' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'nouveau@test.com', password: 'Password1', role: 'user' });

        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({ email: 'nouveau@test.com', role: 'user' });
        expect(res.headers['set-cookie']).toBeDefined();
    });

    test("rejette le rôle 'admin' à l'inscription", async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'hacker@test.com', password: 'Password1', role: 'admin' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/rôle invalide/i);
    });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    test('retourne 401 si email inconnu', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'inconnu@test.com', password: 'pass' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/invalides/i);
    });

    test('retourne 401 si mot de passe incorrect', async () => {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('correct_password', 10);
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'x@x.com', password: hash, role: 'user' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'x@x.com', password: 'mauvais' });

        expect(res.status).toBe(401);
    });

    test('retourne 200 et un cookie si identifiants corrects', async () => {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('secret', 10);
        prisma.user.findUnique.mockResolvedValueOnce({
            id: 2, email: 'user@test.com', password: hash, role: 'pro',
            first_name: 'Alice', last_name: 'Martin', phone: null, is_banned: false,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: 'secret' });

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('pro');
        expect(res.headers['set-cookie']).toBeDefined();
    });
});
