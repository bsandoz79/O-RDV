const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({ execute: jest.fn() }));

const db = require('../db');
const appointmentRoutes = require('../routes/appointments');

const SECRET = 'test_secret';
process.env.JWT_SECRET = SECRET;

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

function makeUserToken(role = 'user', id = 10) {
    return jwt.sign({ id, role }, SECRET);
}

beforeEach(() => jest.clearAllMocks());

// ── POST /api/appointments ────────────────────────────────────────────────────

describe('POST /api/appointments', () => {
    const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    test('retourne 401 sans token', async () => {
        const res = await request(app).post('/api/appointments').send({});
        expect(res.status).toBe(401);
    });

    test('retourne 400 si champs manquants', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${makeUserToken()}`)
            .send({ provider_id: 1 }); // service_id et date manquants

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/obligatoires/i);
    });

    test('retourne 400 si date dans le passé', async () => {
        const past = new Date(Date.now() - 3600 * 1000).toISOString();
        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${makeUserToken()}`)
            .send({ provider_id: 1, service_id: 2, appointment_date: past });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/passé/i);
    });

    test('retourne 400 si prestataire fermé ce jour', async () => {
        // business_hours : fermé
        db.execute.mockResolvedValueOnce([[{ is_closed: 1, open_str: '09:00', close_str: '18:00' }]]);

        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${makeUserToken()}`)
            .send({ provider_id: 1, service_id: 2, appointment_date: FUTURE });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/fermé/i);
    });

    test('retourne 201 pour une réservation valide', async () => {
        // 1. business_hours : ouvert
        db.execute.mockResolvedValueOnce([[{ is_closed: 0, open_str: '00:00', close_str: '00:00' }]]);
        // 2. durée du service
        db.execute.mockResolvedValueOnce([[{ duration: 30 }]]);
        // 3. pas de conflit
        db.execute.mockResolvedValueOnce([[]]);
        // 4. pas de créneau libéré
        db.execute.mockResolvedValueOnce([[]]);
        // 5. INSERT
        db.execute.mockResolvedValueOnce([{ insertId: 99 }]);

        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${makeUserToken()}`)
            .send({ provider_id: 1, service_id: 2, appointment_date: FUTURE });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('appointmentId', 99);
    });

    test('retourne 409 si conflit de créneau', async () => {
        db.execute.mockResolvedValueOnce([[{ is_closed: 0, open_str: '00:00', close_str: '00:00' }]]);
        db.execute.mockResolvedValueOnce([[{ duration: 30 }]]);
        db.execute.mockResolvedValueOnce([[{ id: 55 }]]); // conflit !

        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${makeUserToken()}`)
            .send({ provider_id: 1, service_id: 2, appointment_date: FUTURE });

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/chevauche/i);
    });
});

// ── GET /api/appointments/availability/:providerId/:date ──────────────────────

describe('GET /api/appointments/availability', () => {
    test('retourne closed:true si fermé ce jour', async () => {
        db.execute.mockResolvedValueOnce([[{ is_closed: 1 }]]);

        const res = await request(app)
            .get('/api/appointments/availability/1/2030-06-02');

        expect(res.status).toBe(200);
        expect(res.body.closed).toBe(true);
        expect(res.body.slots).toHaveLength(0);
    });

    test('retourne des créneaux si ouvert', async () => {
        db.execute
            .mockResolvedValueOnce([[{ is_closed: 0, open_str: '09:00', close_str: '11:00' }]])
            .mockResolvedValueOnce([[]]); // aucun RDV

        const res = await request(app)
            .get('/api/appointments/availability/1/2030-06-02?duration=60');

        expect(res.status).toBe(200);
        expect(res.body.closed).toBe(false);
        expect(res.body.slots.length).toBeGreaterThan(0);
        expect(res.body.slots[0]).toHaveProperty('time');
        expect(res.body.slots[0]).toHaveProperty('available');
    });
});
